"""Seed script to populate demo data for KPI and user-management testing.

Usage:
    python back/unit_test/seed_demo_data.py
"""

from datetime import datetime, timedelta
import random
import sys
from pathlib import Path

from passlib.context import CryptContext

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from db import SessionLocal, Base, engine
import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def reset_database(session):
    session.query(models.ProductsList).delete()
    session.query(models.Invoice).delete()
    session.query(models.Product).delete()
    session.query(models.User).delete()
    session.commit()


def create_users(session):
    users = []

    manager = models.User(
        first_name="Alice",
        last_name="Manager",
        email="manager@trinity.local",
        password=pwd_context.hash("manager123"),
        role="manager",
        city="Paris",
        country="France",
    )
    session.add(manager)
    users.append(manager)

    for i in range(1, 11):
        u = models.User(
            first_name=f"Client{i}",
            last_name="Demo",
            email=f"client{i}@trinity.local",
            password=pwd_context.hash("client123"),
            role="client",
            city="Lyon",
            country="France",
        )
        session.add(u)
        users.append(u)

    session.commit()
    for u in users:
        session.refresh(u)
    return users


def create_products(session):
    categories = ["Boissons", "Épicerie", "Frais", "Hygiène", "Snacks"]
    products = []
    for i in range(1, 21):
        p = models.Product(
            off_id=f"DEMO{i:05d}",
            name=f"Produit Demo {i}",
            brand=f"Brand {i%5}",
            category=categories[i % len(categories)],
            price=round(random.uniform(1.5, 15), 2),
            picture="",
            nutritional_info="A",
            available_quantity=random.randint(0, 50),
        )
        session.add(p)
        products.append(p)

    session.commit()
    for p in products:
        session.refresh(p)
    return products


def create_invoices(session, users, products):
    clients = [u for u in users if u.role == "client"]
    now = datetime.utcnow()

    for client in clients:
        invoice_count = random.randint(1, 5)
        for idx in range(invoice_count):
            inv = models.Invoice(
                user_id=client.id,
                total_price=0,
                paypal_id=f"PAY-DEMO-{client.id}-{idx}",
                created_at=now - timedelta(days=random.randint(1, 60)),
            )
            session.add(inv)
            session.flush()

            total = 0.0
            line_count = random.randint(1, 4)
            selected = random.sample(products, line_count)
            for p in selected:
                qty = random.randint(1, 4)
                unit_price = p.price
                line_total = qty * unit_price
                total += line_total

                detail = models.ProductsList(
                    invoice_id=inv.id,
                    product_id=p.id,
                    quantity=qty,
                    unit_price_at_sale=unit_price,
                )
                session.add(detail)

                p.available_quantity = max(0, p.available_quantity - qty)

            inv.total_price = round(total, 2)

    session.commit()


def main():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        reset_database(session)
        users = create_users(session)
        products = create_products(session)
        create_invoices(session, users, products)
        print("✅ Demo data generated")
        print("Manager login: manager@trinity.local / manager123")
        print("Client login: client1@trinity.local / client123")
    finally:
        session.close()


if __name__ == "__main__":
    main()
