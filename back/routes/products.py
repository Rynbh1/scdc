from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
import models
import requests
from pydantic import BaseModel

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/scan/{barcode}")
def scan_product(barcode: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.off_id == barcode).first()
    
    if product:
        return product

    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    try:
        response = requests.get(url)
        data = response.json()
        
        if data.get("status") == 1:
            p_data = data["product"]
            
            new_product = models.Product(
                off_id=barcode,
                name=p_data.get("product_name", "Inconnu"),
                brand=p_data.get("brands", ""),
                category=p_data.get("categories", "").split(',')[0],
                picture=p_data.get("image_front_url", ""),
                price=0.0,
                nutritional_info=p_data.get("nutriscore_grade", "").upper()
            )
            
            db.add(new_product)
            db.commit()
            db.refresh(new_product)
            return new_product
        else:
            raise HTTPException(status_code=404, detail="Produit introuvable")
            
    except Exception as e:
        print(e)
        raise HTTPException(status_code=404, detail="Erreur lors de la récupération")

@router.get("/search/{query}")
def search_product(query: str, db: Session = Depends(get_db)):
    local_products = db.query(models.Product).filter(models.Product.name.ilike(f"%{query}%")).all()
    
    if local_products:
        return local_products

    url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&search_simple=1&action=process&json=1&page_size=5"
    try:
        response = requests.get(url)
        data = response.json()
        
        results = []
        for p in data.get('products', []):
            results.append({
                "off_id": p.get("code", ""),
                "name": p.get("product_name", "Inconnu"),
                "brand": p.get("brands", ""),
                "picture": p.get("image_front_small_url", ""),
                "price": 0,
                "is_external": True
            })
        return results
            
    except Exception as e:
        print(f"Erreur OFF: {e}")
        return []
    
class ProductUpdate(BaseModel):
    price: float

@router.put("/update_price/{barcode}")
def update_price(barcode: str, item: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.off_id == barcode).first()
    if not product:
        # Si le produit venait de la recherche OFF et n'est pas encore en base, il faut le créer
        # (Cas complexe, pour l'instant assumons qu'on scanne d'abord)
        raise HTTPException(status_code=404, detail="Produit non trouvé en base, scannez-le d'abord")
    
    product.price = item.price
    db.commit()
    return {"message": "Prix mis à jour", "price": product.price}