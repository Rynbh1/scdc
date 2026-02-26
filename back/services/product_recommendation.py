from __future__ import annotations

from typing import TYPE_CHECKING, Any, Iterable

if TYPE_CHECKING:
    import models


def recommend_products(products: Iterable[Any], limit: int = 5) -> list[Any]:
    """Recommend products prioritizing stocked, affordable and complete references."""

    scored = []
    for product in products:
        stock = max(getattr(product, "available_quantity", 0) or 0, 0)
        price = max(getattr(product, "price", 0.0) or 0.0, 0.0)
        quality_bonus = 1.0 if getattr(product, "picture", "") else 0.0
        freshness_bonus = 0.5 if getattr(product, "nutritional_info", "") else 0.0
        name = getattr(product, "name", "").lower()

        score = (stock * 2.0) + quality_bonus + freshness_bonus - (price / 10.0)
        scored.append((score, name, product))

    scored.sort(key=lambda item: (-item[0], item[1]))
    return [item[2] for item in scored[:limit]]
