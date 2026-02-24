from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import reports, auth, products, invoices, users
import models
from db import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Trinity API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(products.router)
app.include_router(invoices.router)
app.include_router(users.router)

@app.get("/")
def root():
    return {"message": "Trinity API is running"}