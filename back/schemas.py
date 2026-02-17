from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    zip_code: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    zip_code: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None

    class Config:
        from_attributes = True