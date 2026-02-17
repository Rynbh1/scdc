from sqlalchemy.orm import Session
from db import SessionLocal, engine
import models
from passlib.context import CryptContext
import getpass

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_manager():
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    print("--- CRÉATION COMPTE MANAGER ---")
    first_name = input("Prénom : ")
    last_name = input("Nom : ")
    email = input("Email : ")
    password = getpass.getpass("Mot de passe : ")
    
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        print("Erreur : Cet email existe déjà !")
        return

    hashed_password = pwd_context.hash(password)
    
    new_manager = models.User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        password=hashed_password,
        role="manager",
        phone_number="0000000000",
        address="Siège Social",
        zip_code="00000",
        city="Trinity City",
        country="France"
    )
    
    try:
        db.add(new_manager)
        db.commit()
        print(f"✅ Succès ! Le manager {email} a été créé.")
    except Exception as e:
        print(f"❌ Erreur lors de la création : {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_manager()