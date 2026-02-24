@router.get("/history", response_model=List[schemas.InvoiceOut])
async def get_my_invoices(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Invoice).filter(models.Invoice.user_id == current_user.id).all()