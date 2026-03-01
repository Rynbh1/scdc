from typing import Optional

import requests
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

from db import get_db
import models
from services.auth_logic import get_current_user

router = APIRouter(prefix="/products", tags=["Products"])


class ProductBasePayload(BaseModel):
    name: str = Field(min_length=1)
    brand: str = ""
    category: str = ""
    price: float = Field(gt=0)
    picture: str = ""
    nutritional_info: str = ""
    available_quantity: int = Field(ge=0)


class ProductCreatePayload(ProductBasePayload):
    off_id: Optional[str] = None


class ProductUpdatePayload(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    brand: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    picture: Optional[str] = None
    nutritional_info: Optional[str] = None
    available_quantity: Optional[int] = Field(default=None, ge=0)


class ProductStockUpdate(BaseModel):
    price: float = Field(gt=0)
    available_quantity: int = Field(ge=0)


SORTABLE_FIELDS = {
    "name": models.Product.name,
    "price": models.Product.price,
    "stock": models.Product.available_quantity,
    "category": models.Product.category,
    "brand": models.Product.brand,
}


def _ensure_manager(user: models.User):
    if user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les managers peuvent modifier les produits",
        )


def _fetch_openfoodfacts_payload(barcode: str) -> dict:
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    response = requests.get(url, timeout=10)
    data = response.json()

    if data.get("status") != 1:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    p_data = data["product"]
    return {
        "off_id": barcode,
        "name": p_data.get("product_name", "Inconnu"),
        "brand": p_data.get("brands", ""),
        "category": (p_data.get("categories", "") or "").split(",")[0],
        "picture": p_data.get("image_front_url", ""),
        "price": 0.0,
        "nutritional_info": (p_data.get("nutriscore_grade", "") or "").upper(),
        "available_quantity": 0,
    }


def _fetch_from_openfoodfacts(barcode: str, db: Session) -> models.Product:
    product_payload = _fetch_openfoodfacts_payload(barcode)
    new_product = models.Product(
        **product_payload,
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.post("/manager", status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreatePayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _ensure_manager(current_user)

    if payload.off_id:
        existing = db.query(models.Product).filter(models.Product.off_id == payload.off_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Un produit avec ce code-barres existe déjà")

    new_product = models.Product(**payload.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.get("")
@router.get("/")
def list_products(
    db: Session = Depends(get_db),
    q: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = Query(default=None, ge=0),
    max_price: Optional[float] = Query(default=None, ge=0),
    in_stock: Optional[bool] = None,
    sort_by: str = Query(default="name"),
    sort_order: str = Query(default="asc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    query = db.query(models.Product)

    if q:
        query = query.filter(models.Product.name.ilike(f"%{q}%"))
    if category:
        query = query.filter(models.Product.category.ilike(f"%{category}%"))
    if brand:
        query = query.filter(models.Product.brand.ilike(f"%{brand}%"))
    if min_price is not None:
        query = query.filter(models.Product.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Product.price <= max_price)
    if in_stock is True:
        query = query.filter(models.Product.available_quantity > 0)
    elif in_stock is False:
        query = query.filter(models.Product.available_quantity <= 0)

    sort_column = SORTABLE_FIELDS.get(sort_by, models.Product.name)
    query = query.order_by(desc(sort_column) if sort_order.lower() == "desc" else asc(sort_column))

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
        },
    }


@router.get("/advanced-search")
def advanced_search_products(
    db: Session = Depends(get_db),
    q: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = Query(default=None, ge=0),
    max_price: Optional[float] = Query(default=None, ge=0),
    in_stock: Optional[bool] = None,
    sort_by: str = Query(default="name"),
    sort_order: str = Query(default="asc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    return list_products(
        db=db,
        q=q,
        category=category,
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        in_stock=in_stock,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.get("/scan/{barcode}")
def scan_product(barcode: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.off_id == barcode).first()
    if product:
        return product

    try:
        return {
            **_fetch_openfoodfacts_payload(barcode),
            "is_external": True,
            "requires_manager_action": True,
        }
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
                "category": (p.get("categories", "") or "").split(",")[0],
                "picture": p.get("image_front_small_url", ""),
                "price": 0,
                "available_quantity": 0,
                "is_external": True,
            }
            for p in data.get("products", [])
        ]
    except Exception:
        return []


@router.post("/import/off/{barcode}", status_code=status.HTTP_201_CREATED)
def import_product_from_openfoodfacts(
    barcode: str,
    overwrite: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _ensure_manager(current_user)

    existing = db.query(models.Product).filter(models.Product.off_id == barcode).first()
    if existing and not overwrite:
        return {"message": "Produit déjà existant", "product": existing}

    if existing and overwrite:
        db.delete(existing)
        db.commit()

    product = _fetch_from_openfoodfacts(barcode, db)
    return {"message": "Produit importé depuis Open Food Facts", "product": product}


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return product


@router.put("/{product_id}")
def update_product(
    product_id: int,
    payload: ProductUpdatePayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _ensure_manager(current_user)

    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _ensure_manager(current_user)

    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    db.delete(product)
    db.commit()
    return {"message": "Produit supprimé"}


@router.put("/manager/stock/{barcode}")
def upsert_product_stock(
    barcode: str,
    payload: ProductStockUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _ensure_manager(current_user)

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