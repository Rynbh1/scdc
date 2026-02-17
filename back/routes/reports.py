from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from db import get_db
import models

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/")
def read_reports(db: Session = Depends(get_db)):
    total_sales = db.query(func.sum(models.Invoice.total_price)).scalar() or 0
    total_invoices = db.query(func.count(models.Invoice.id)).scalar() or 0
    average_basket = round(total_sales / total_invoices, 2) if total_invoices > 0 else 0
    
    total_products = db.query(func.count(models.Product.id)).scalar() or 0
    out_of_stock = db.query(func.count(models.Product.id)).filter(models.Product.available_quantity <= 0).scalar() or 0
    rupture_rate = round((out_of_stock / total_products) * 100, 1) if total_products > 0 else 0
    

    loyal_customers = db.query(models.Invoice.user_id).group_by(models.Invoice.user_id).having(func.count(models.Invoice.id) > 1).count()
    total_customers = db.query(func.count(models.User.id)).scalar() or 1
    loyalty_rate = round((loyal_customers / total_customers) * 100, 1)

    return {
        "average_basket": average_basket,
        "stock_rupture_rate": rupture_rate,
        "customer_loyalty_rate": loyalty_rate,
        "total_revenue": total_sales,
        "total_transactions": total_invoices
    }