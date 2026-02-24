from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from db import get_db
import models
from services.auth_logic import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

LOYALTY_MIN_PURCHASES = 2


@router.get("/")
def read_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les managers peuvent accéder aux KPI",
        )

    total_sales = db.query(func.sum(models.Invoice.total_price)).scalar() or 0
    total_invoices = db.query(func.count(models.Invoice.id)).scalar() or 0
    average_basket = round(total_sales / total_invoices, 2) if total_invoices > 0 else 0

    total_products = db.query(func.count(models.Product.id)).scalar() or 0
    out_of_stock = (
        db.query(func.count(models.Product.id))
        .filter(models.Product.available_quantity <= 0)
        .scalar()
        or 0
    )
    stock_rupture_rate = round((out_of_stock / total_products) * 100, 2) if total_products > 0 else 0

    customers_with_purchases = db.query(func.count(func.distinct(models.Invoice.user_id))).scalar() or 0
    repeat_customers = (
        db.query(models.Invoice.user_id)
        .group_by(models.Invoice.user_id)
        .having(func.count(models.Invoice.id) >= LOYALTY_MIN_PURCHASES)
        .count()
    )
    customer_loyalty_rate = (
        round((repeat_customers / customers_with_purchases) * 100, 2)
        if customers_with_purchases > 0
        else 0
    )

    top_products_rows = (
        db.query(
            models.Product.id,
            models.Product.name,
            func.sum(models.ProductsList.quantity).label("total_sold"),
        )
        .join(models.ProductsList, models.ProductsList.product_id == models.Product.id)
        .group_by(models.Product.id)
        .order_by(func.sum(models.ProductsList.quantity).desc())
        .limit(5)
        .all()
    )
    top_products = [
        {
            "product_id": row.id,
            "name": row.name,
            "total_sold": int(row.total_sold or 0),
        }
        for row in top_products_rows
    ]

    revenue_by_category_rows = (
        db.query(
            func.coalesce(models.Product.category, "Non catégorisé").label("category"),
            func.sum(models.ProductsList.quantity * models.ProductsList.unit_price_at_sale).label(
                "revenue"
            ),
        )
        .join(models.ProductsList, models.ProductsList.product_id == models.Product.id)
        .group_by(func.coalesce(models.Product.category, "Non catégorisé"))
        .order_by(func.sum(models.ProductsList.quantity * models.ProductsList.unit_price_at_sale).desc())
        .all()
    )
    revenue_by_category = [
        {
            "category": row.category,
            "revenue": round(float(row.revenue or 0), 2),
        }
        for row in revenue_by_category_rows
    ]

    return {
        "average_basket": average_basket,
        "stock_rupture_rate": stock_rupture_rate,
        "customer_loyalty_rate": customer_loyalty_rate,
        "top_products": top_products,
        "revenue_by_category": revenue_by_category,
        "meta": {
            "loyalty_min_purchases": LOYALTY_MIN_PURCHASES,
            "total_invoices": total_invoices,
            "total_products": total_products,
        },
    }
