import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db import Product, ProductsList, User, Invoice
engine = create_engine('sqlite:///trinity_store.db')
Session = sessionmaker(bind=engine)
session = Session()

def seed_data():
    users = [
        User(first_name="Jean", last_name="Dupont", email="jean@epitech.eu", password="hash_password", 
             address="1 rue de la Paix", zip_code="75001", city="Paris", country="France"),
        User(first_name="Marie", last_name="Curie", email="marie@science.fr", password="hash_password", 
             address="12 Avenue des Sciences", zip_code="69000", city="Lyon", country="France")
    ]
    session.add_all(users)
    session.commit()

    products = [
        Product(name="Pâte à tartiner", brand="Nutella", category="Épicerie sucrée", price=4.50, 
                available_quantity=50, off_id="3017620422003", nutritional_info="Sucre, huile..."),
        Product(name="Lait Demi-écrémé", brand="Lactel", category="Produits laitiers", price=1.20, 
                available_quantity=100, off_id="3155250349793", nutritional_info="Calcium..."),
        Product(name="Sardines à l'huile", brand="Connétable", category="Conserves", price=2.80, 
                available_quantity=0, off_id="3263670111100", nutritional_info="Omega 3...")
    ]
    session.add_all(products)
    session.commit()

    inv1 = Invoice(user_id=users[0].id, total_price=10.20, paypal_id="PAYID-12345", 
                   created_at=datetime.utcnow() - timedelta(days=1))
    session.add(inv1)
    session.commit()

    details = [
        ProductsList(invoice_id=inv1.id, product_id=products[0].id, quantity=2, unit_price_at_sale=4.50),
        ProductsList(invoice_id=inv1.id, product_id=products[1].id, quantity=1, unit_price_at_sale=1.20)
    ]
    session.add_all(details)
    
    inv2 = Invoice(user_id=users[1].id, total_price=2.80, paypal_id="PAYID-67890", 
                   created_at=datetime.utcnow())
    session.add(inv2)
    session.commit()

    details2 = [
        ProductsList(invoice_id=inv2.id, product_id=products[2].id, quantity=1, unit_price_at_sale=2.80)
    ]
    session.add_all(details2)
    session.commit()

    print("Seed terminé : Données injectées avec succès !")

if __name__ == "__main__":
    seed_data()