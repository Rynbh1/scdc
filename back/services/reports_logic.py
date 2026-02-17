from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Invoice, Product, ProductsList

def calculate_kpi_reports(db: Session):
    avg_basket = db.query(func.avg(Invoice.total_price)).scalar() or 0

    top_products = (
        db.query(Product.name, func.sum(ProductsList.quantity).label("total_sold"))
        .join(ProductsList)
        .group_by(Product.id)
        .order_by(func.sum(ProductsList.quantity).desc())
        .limit(5)
        .all()
    )
    top_products_list = [{"name": p.name, "value": p.total_sold} for p in top_products]

    total_refs = db.query(Product).count()
    out_of_stock = db.query(Product).filter(Product.available_quantity == 0).count()
    stock_rupture_rate = (out_of_stock / total_refs * 100) if total_refs > 0 else 0

    ca_per_day = (
        db.query(func.date(Invoice.created_at), func.sum(Invoice.total_price))
        .group_by(func.date(Invoice.created_at))
        .order_by(func.date(Invoice.created_at).desc())
        .limit(7)
        .all()
    )
    ca_list = [{"date": str(d), "amount": a} for d, a in ca_per_day]

    total_customers = db.query(func.count(func.distinct(Invoice.user_id))).scalar() or 0
    repeat_customers = (
        db.query(Invoice.user_id)
        .group_by(Invoice.user_id)
        .having(func.count(Invoice.id) > 1)
        .count()
    )
    loyalty_rate = (repeat_customers / total_customers * 100) if total_customers > 0 else 0

    return {
        "average_basket": round(avg_basket, 2),
        "top_products": top_products_list,
        "stock_rupture_rate": round(stock_rupture_rate, 2),
        "revenue_history": ca_list,
        "customer_loyalty_rate": round(loyalty_rate, 2)
    }