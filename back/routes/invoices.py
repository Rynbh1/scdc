from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db import get_db
import models, schemas
from services.auth_logic import get_current_user

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.get("/me", response_model=List[schemas.InvoiceOut])
async def get_my_invoices(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invoices = db.query(models.Invoice).filter(models.Invoice.user_id == current_user.id).all()
    return invoices