from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
import models
import requests
from pydantic import BaseModel

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/scan/{barcode}")
def scan_product(barcode: str, db: Session = Depends(get_db)):
    # 1. Chercher dans la base locale
    product = db.query(models.Product).filter(models.Product.off_id == barcode).first()
    
    if product:
        return product

    # 2. Si pas trouvé, chercher sur OpenFoodFacts
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    try:
        response = requests.get(url)
        data = response.json()
        
        if data.get("status") == 1:
            p_data = data["product"]
            
            # 3. Créer le produit dans la base locale
            new_product = models.Product(
                off_id=barcode,
                name=p_data.get("product_name", "Inconnu"),
                brand=p_data.get("brands", ""),
                category=p_data.get("categories", "").split(',')[0],
                picture=p_data.get("image_front_url", ""),
                price=0.0, # Prix par défaut à définir
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
    # 1. D'abord, on cherche dans TA boutique (produits déjà scannés/connus)
    local_products = db.query(models.Product).filter(models.Product.name.ilike(f"%{query}%")).all()
    
    if local_products:
        return local_products

    # 2. Si pas trouvé chez toi, on cherche dans le catalogue mondial OpenFoodFacts
    url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&search_simple=1&action=process&json=1&page_size=5"
    try:
        response = requests.get(url)
        data = response.json()
        
        results = []
        for p in data.get('products', []):
            # On formate pour que ça ressemble à ton modèle, mais SANS l'enregistrer tout de suite
            results.append({
                "off_id": p.get("code", ""), # Le code barre est crucial pour l'ajout futur
                "name": p.get("product_name", "Inconnu"),
                "brand": p.get("brands", ""),
                "picture": p.get("image_front_small_url", ""),
                "price": 0, # Un produit externe n'a pas encore de prix chez toi
                "is_external": True # Petit flag pour dire au front "Ce produit n'est pas encore dans ta base"
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