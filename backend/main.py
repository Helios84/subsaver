from datetime import datetime, timedelta
from typing import Generator, Optional, List
import os

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship

from dotenv import load_dotenv

# --- Load .env ---
load_dotenv()  # ищет .env в текущей папке (backend/)

# --- Config ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./subsaver.db")

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is not set in environment variables")

JWT_ALG = os.getenv("JWT_ALG", "HS256")
JWT_EXPIRES_MIN = int(os.getenv("JWT_EXPIRES_MIN", str(60 * 24)))  # 24h

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is missing. Create backend/.env with JWT_SECRET=... (do NOT commit it)")

# --- DB setup ---
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)

    name = Column(String, nullable=False)
    price_cents = Column(Integer, nullable=False)
    billing_cycle = Column(String, default="monthly")  # monthly|yearly
    status = Column(String, default="active")          # active|cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="subscriptions")


Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Auth helpers ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ВАЖНО: tokenUrl должен совпадать с эндпоинтом, который принимает form-data
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def hash_password(pw: str) -> str:
    return pwd_context.hash(pw)


def verify_password(pw: str, hashed: str) -> bool:
    return pwd_context.verify(pw, hashed)


def create_access_token(email: str) -> str:
    exp = datetime.utcnow() + timedelta(minutes=JWT_EXPIRES_MIN)
    payload = {"sub": email, "exp": exp}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def get_current_email(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(db: Session = Depends(get_db), email: str = Depends(get_current_email)) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# --- API models ---
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SubscriptionCreate(BaseModel):
    name: str
    price_cents: int
    billing_cycle: str = "monthly"
    status: str = "active"


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    price_cents: Optional[int] = None
    billing_cycle: Optional[str] = None
    status: Optional[str] = None


class SubscriptionOut(BaseModel):
    id: int
    name: str
    price_cents: int
    billing_cycle: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# --- Auth ---
@app.post("/auth/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()

    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    exists = db.query(User).filter(User.email == email).first()
    if exists:
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(email=email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    return {"message": "registered"}


# JSON login (для фронта)
@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": create_access_token(email), "token_type": "bearer"}


# OAuth2 Password Flow (для Swagger Authorize)
@app.post("/auth/token", response_model=TokenResponse)
def token(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = form.username.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": create_access_token(email), "token_type": "bearer"}


@app.get("/me")
def me(current_email: str = Depends(get_current_email)):
    return {"email": current_email}


# --- Subscriptions CRUD (protected) ---
@app.get("/subscriptions", response_model=List[SubscriptionOut])
def list_subscriptions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
        .all()
    )


@app.post("/subscriptions", response_model=SubscriptionOut)
def create_subscription(payload: SubscriptionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.price_cents < 0:
        raise HTTPException(status_code=400, detail="price_cents must be >= 0")
    if payload.billing_cycle not in ("monthly", "yearly"):
        raise HTTPException(status_code=400, detail="billing_cycle must be 'monthly' or 'yearly'")
    if payload.status not in ("active", "cancelled"):
        raise HTTPException(status_code=400, detail="status must be 'active' or 'cancelled'")

    sub = Subscription(
        user_id=current_user.id,
        name=payload.name,
        price_cents=payload.price_cents,
        billing_cycle=payload.billing_cycle,
        status=payload.status,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@app.patch("/subscriptions/{sub_id}", response_model=SubscriptionOut)
def update_subscription(sub_id: int, payload: SubscriptionUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id, Subscription.user_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if payload.price_cents is not None and payload.price_cents < 0:
        raise HTTPException(status_code=400, detail="price_cents must be >= 0")
    if payload.billing_cycle is not None and payload.billing_cycle not in ("monthly", "yearly"):
        raise HTTPException(status_code=400, detail="billing_cycle must be 'monthly' or 'yearly'")
    if payload.status is not None and payload.status not in ("active", "cancelled"):
        raise HTTPException(status_code=400, detail="status must be 'active' or 'cancelled'")

    if payload.name is not None:
        sub.name = payload.name
    if payload.price_cents is not None:
        sub.price_cents = payload.price_cents
    if payload.billing_cycle is not None:
        sub.billing_cycle = payload.billing_cycle
    if payload.status is not None:
        sub.status = payload.status

    db.commit()
    db.refresh(sub)
    return sub


@app.delete("/subscriptions/{sub_id}")
def delete_subscription(sub_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id, Subscription.user_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    db.delete(sub)
    db.commit()
    return {"message": "deleted"}
