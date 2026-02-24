import os
from datetime import datetime
from typing import List

import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from db import get_db
import models
from services.auth_logic import get_current_user

router = APIRouter(prefix="/invoices", tags=["Invoices"])

PAYPAL_BASE_URL = os.getenv("PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com")
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", "")


class CheckoutItem(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class BillingInfo(BaseModel):
    first_name: str
    last_name: str
    address: str
    zip_code: str
    city: str


class CheckoutPayload(BaseModel):
    items: List[CheckoutItem]
    billing: BillingInfo
    paypal_order_id: str


def _paypal_access_token() -> str:
    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Configuration PayPal manquante")

    resp = requests.post(
        f"{PAYPAL_BASE_URL}/v1/oauth2/token",
        data={"grant_type": "client_credentials"},
        auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET),
        timeout=15,
    )
    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail="Impossible d'authentifier PayPal")
    return resp.json().get("access_token", "")


def _paypal_create_order(total: float) -> dict:
    token = _paypal_access_token()
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [{"amount": {"currency_code": "EUR", "value": f"{total:.2f}"}}],
    }
    resp = requests.post(
        f"{PAYPAL_BASE_URL}/v2/checkout/orders",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=payload,
        timeout=15,
    )
    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail="Création commande PayPal impossible")
    return resp.json()


def _paypal_capture_order(order_id: str) -> dict:
    token = _paypal_access_token()
    resp = requests.post(
        f"{PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}/capture",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=15,
    )
    if resp.status_code >= 400:
        raise HTTPException(status_code=400, detail="Capture PayPal impossible")
    return resp.json()


@router.post("/paypal/create-order")
@router.post("/paypal/create-order/")
def create_paypal_order(
    items: List[CheckoutItem],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not items:
        raise HTTPException(status_code=400, detail="Panier vide")

    total = 0.0
    for line in items:
        product = db.query(models.Product).filter(models.Product.id == line.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Produit {line.product_id} introuvable")
        if product.available_quantity < line.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuffisant pour {product.name}")
        total += product.price * line.quantity

    order = _paypal_create_order(total)
    return {"paypal_order_id": order.get("id"), "paypal": order, "total": round(total, 2)}


@router.post("/checkout")
@router.post("/checkout/")
def checkout(
    payload: CheckoutPayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Panier vide")

    capture = _paypal_capture_order(payload.paypal_order_id)
    if capture.get("status") != "COMPLETED":
        raise HTTPException(status_code=400, detail="Paiement PayPal non complété")

    total = 0.0
    product_lines = []
    for line in payload.items:
        product = db.query(models.Product).filter(models.Product.id == line.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Produit {line.product_id} introuvable")
        if product.available_quantity < line.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuffisant pour {product.name}")
        total += product.price * line.quantity
        product_lines.append((product, line.quantity, product.price))

    invoice = models.Invoice(
        user_id=current_user.id,
        total_price=round(total, 2),
        paypal_id=payload.paypal_order_id,
        created_at=datetime.utcnow(),
    )
    db.add(invoice)
    db.flush()

    for product, quantity, unit_price in product_lines:
        db.add(
            models.ProductsList(
                invoice_id=invoice.id,
                product_id=product.id,
                quantity=quantity,
                unit_price_at_sale=unit_price,
            )
        )
        product.available_quantity -= quantity

    db.commit()
    db.refresh(invoice)

    return {
        "message": "Paiement validé et commande enregistrée",
        "invoice_id": invoice.id,
        "total_price": invoice.total_price,
        "paypal_id": invoice.paypal_id,
        "billing": payload.billing.model_dump(),
    }


@router.get("/me")
@router.get("/me/")
async def get_my_invoices(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoices = db.query(models.Invoice).filter(models.Invoice.user_id == current_user.id).order_by(models.Invoice.created_at.desc()).all()

    result = []
    for inv in invoices:
        details = db.query(models.ProductsList).filter(models.ProductsList.invoice_id == inv.id).all()
        result.append(
            {
                "id": inv.id,
                "date": inv.created_at,
                "total_price": inv.total_price,
                "user_id": inv.user_id,
                "paypal_id": inv.paypal_id,
                "items": [
                    {
                        "id": d.id,
                        "product_id": d.product_id,
                        "product_name": d.product.name if d.product else "Produit supprimé",
                        "quantity": d.quantity,
                        "unit_price": d.unit_price_at_sale,
                    }
                    for d in details
                ],
            }
        )
    return result
