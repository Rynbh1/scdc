from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from db import Base
from sqlalchemy.orm import relationship
from datetime import datetime

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="client")
    phone_number = Column(String(20))
    address = Column(String(255))
    zip_code = Column(String(10))
    city = Column(String(100))
    country = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    invoices = relationship("Invoice", back_populates="user")

class Product(Base):
    __tablename__ = 'products'
    id = Column(Integer, primary_key=True)
    off_id = Column(String(50), unique=True)
    name = Column(String(255), nullable=False)
    brand = Column(String(100))
    category = Column(String(100))
    price = Column(Float, nullable=False)
    picture = Column(String(255))
    nutritional_info = Column(Text)
    available_quantity = Column(Integer, default=0)
    items = relationship("ProductsList", back_populates="product")

class Invoice(Base):
    __tablename__ = 'invoices'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    total_price = Column(Float, nullable=False)
    paypal_id = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="invoices")
    details = relationship("ProductsList", back_populates="invoice")

class ProductsList(Base):
    __tablename__ = 'products_list'
    id = Column(Integer, primary_key=True)
    invoice_id = Column(Integer, ForeignKey('invoices.id'))
    product_id = Column(Integer, ForeignKey('products.id'))
    quantity = Column(Integer, nullable=False)
    unit_price_at_sale = Column(Float, nullable=False)
    invoice = relationship("Invoice", back_populates="details")
    product = relationship("Product", back_populates="items")
