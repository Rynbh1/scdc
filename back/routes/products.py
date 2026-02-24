from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import requests

from db import get_db
import models
from services.auth_logic import get_current_user

router = APIRouter(prefix="/products", tags=["Products"])


class ProductStockUpdate(BaseModel):
    price: float = Field(gt=0)
    available_quantity: int = Field(ge=0)


def _fetch_from_openfoodfacts(barcode: str, db: Session) -> models.Product:
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    response = requests.get(url, timeout=10)
    data = response.json()

    if data.get("status") != 1:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    p_data = data["product"]
    new_product = models.Product(
        off_id=barcode,
        name=p_data.get("product_name", "Inconnu"),
        brand=p_data.get("brands", ""),
        category=(p_data.get("categories", "") or "").split(",")[0],
        picture=p_data.get("image_front_url", ""),
        price=0.0,
        nutritional_info=(p_data.get("nutriscore_grade", "") or "").upper(),
        available_quantity=0,
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.put("/manager/stock/{barcode}")
def upsert_product_stock(
    barcode: str,
    payload: ProductStockUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les managers peuvent modifier le stock",
        )

    product = db.query(models.Product).filter(models.Product.off_id == barcode).first()
    if not product:
        product = _fetch_from_openfoodfacts(barcode, db)

    product.price = payload.price
    product.available_quantity = payload.available_quantity
    db.commit()
    db.refresh(product)

    return {
        "message": "Produit mis à jour",
        "product": {
            "id": product.id,
            "off_id": product.off_id,
            "name": product.name,
            "price": product.price,
            "available_quantity": product.available_quantity,
        },
    }


@router.get("/scan/{barcode}")
def scan_product(barcode: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.off_id == barcode).first()
    if product:
        return product

    try:
        return _fetch_from_openfoodfacts(barcode, db)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Erreur lors de la récupération")


@router.get("/search/{query}")
def search_product(query: str, db: Session = Depends(get_db)):
    local_products = db.query(models.Product).filter(models.Product.name.ilike(f"%{query}%")).all()
    if local_products:
        return local_products

    url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&search_simple=1&action=process&json=1&page_size=5"
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        return [
            {
                "off_id": p.get("code", ""),
                "name": p.get("product_name", "Inconnu"),
                "brand": p.get("brands", ""),
                "picture": p.get("image_front_small_url", ""),
                "price": 0,
                "available_quantity": 0,
                "is_external": True,
            }
            for p in data.get("products", [])
        ]
    except Exception:
        return []
