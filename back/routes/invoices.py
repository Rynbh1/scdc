from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from db import get_db
import models

router = APIRouter(prefix="/invoices", tags=["Invoices"])

class CartItem(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class InvoiceCreate(BaseModel):
    items: List[CartItem]
    user_id: int 

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_invoice(invoice_data: InvoiceCreate, db: Session = Depends(get_db)):
    total_amount = sum(item.quantity * item.unit_price for item in invoice_data.items)
    
    new_invoice = models.Invoice(
        user_id=invoice_data.user_id,
        total_price=total_amount,
        paypal_id="PAYPAL_TEST_ID"
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    
    for item in invoice_data.items:
        detail = models.ProductsList(
            invoice_id=new_invoice.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price_at_sale=item.unit_price
        )
        db.add(detail)
        
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.available_quantity -= item.quantity

    db.commit()
    
    return {"message": "Commande validée", "invoice_id": new_invoice.id, "total": total_amount}