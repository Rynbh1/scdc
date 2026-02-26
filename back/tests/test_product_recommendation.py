from dataclasses import dataclass

from services.product_recommendation import recommend_products


@dataclass
class ProductStub:
    name: str
    available_quantity: int
    price: float
    picture: str = ""
    nutritional_info: str = ""


def test_recommend_products_prefers_stock_and_low_price():
    products = [
        ProductStub("Premium", available_quantity=1, price=45),
        ProductStub("Eco", available_quantity=7, price=10),
        ProductStub("Middle", available_quantity=4, price=20),
    ]

    ranked = recommend_products(products, limit=2)

    assert [p.name for p in ranked] == ["Eco", "Middle"]


def test_recommend_products_applies_limit_and_bonuses():
    products = [
        ProductStub("NoMeta", available_quantity=3, price=10),
        ProductStub("WithMeta", available_quantity=3, price=10, picture="x.png", nutritional_info="A"),
    ]

    ranked = recommend_products(products, limit=1)

    assert len(ranked) == 1
    assert ranked[0].name == "WithMeta"
