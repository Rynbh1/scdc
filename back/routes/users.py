from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from db import get_db
import models
from services.auth_logic import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _ensure_manager(current_user: models.User):
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les managers peuvent gérer les utilisateurs",
        )


@router.get("")
@router.get("/")
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    q: Optional[str] = Query(default=None),
    role: Optional[str] = Query(default=None),
):
    _ensure_manager(current_user)

    query = db.query(models.User)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (models.User.first_name.ilike(like))
            | (models.User.last_name.ilike(like))
            | (models.User.email.ilike(like))
        )
    if role:
        query = query.filter(models.User.role == role)

    users = query.order_by(models.User.created_at.desc()).all()
    return users


@router.get("/{user_id}")
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _ensure_manager(current_user)

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    invoices = db.query(models.Invoice).filter(models.Invoice.user_id == user_id).order_by(models.Invoice.created_at.desc()).all()
    history = []
    for inv in invoices:
        details = db.query(models.ProductsList).filter(models.ProductsList.invoice_id == inv.id).all()
        history.append(
            {
                "invoice_id": inv.id,
                "created_at": inv.created_at,
                "total_price": inv.total_price,
                "paypal_id": inv.paypal_id,
                "items": [
                    {
                        "product_id": d.product_id,
                        "product_name": d.product.name if d.product else "Produit supprimé",
                        "quantity": d.quantity,
                        "unit_price_at_sale": d.unit_price_at_sale,
                    }
                    for d in details
                ],
            }
        )

    return {
        "user": user,
        "purchase_payment_history": history,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _ensure_manager(current_user)

    email = payload.get("email")
    password = payload.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="email et password sont requis")

    exists = db.query(models.User).filter(models.User.email == email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Cet email existe déjà")

    new_user = models.User(
        first_name=payload.get("first_name", ""),
        last_name=payload.get("last_name", ""),
        email=email,
        password=pwd_context.hash(password),
        role=payload.get("role", "client"),
        phone_number=payload.get("phone_number"),
        address=payload.get("address"),
        zip_code=payload.get("zip_code"),
        city=payload.get("city"),
        country=payload.get("country"),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/{user_id}")
def update_user(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _ensure_manager(current_user)

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    for key in ["first_name", "last_name", "role", "phone_number", "address", "zip_code", "city", "country"]:
        if key in payload:
            setattr(user, key, payload[key])

    if "password" in payload and payload["password"]:
        user.password = pwd_context.hash(payload["password"])

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _ensure_manager(current_user)

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Impossible de supprimer son propre compte")

    db.delete(user)
    db.commit()
    return {"message": "Utilisateur supprimé"}
