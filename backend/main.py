from datetime import datetime, timedelta
from typing import Generator, Optional, List
import os

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship

from dotenv import load_dotenv

# Import dependencies
from dependencies import get_db, get_current_email, get_current_user

# --- Load .env ---
load_dotenv()

# --- Config ---
# --- Config ---
# DATABASE_URL moved to database.py

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is not set in environment variables")

JWT_ALG = os.getenv("JWT_ALG", "HS256")
JWT_EXPIRES_MIN = int(os.getenv("JWT_EXPIRES_MIN", str(60 * 24)))  # 24h

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is missing. Create backend/.env with JWT_SECRET=... (do NOT commit it)")

# --- DB setup ---
# --- DB setup ---
from database import engine, SessionLocal, Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Reminder settings
    reminder_enabled = Column(Boolean, default=True)
    reminder_days_before = Column(Integer, default=7)  # 3, 7, or 14 days

    # Student Verification
    is_verified = Column(Boolean, default=False)
    edu_email = Column(String, nullable=True)
    verification_code = Column(String, nullable=True)
    verification_code_expires = Column(DateTime, nullable=True)

    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)

    name = Column(String, nullable=False)
    price_cents = Column(Integer, nullable=False)
    billing_cycle = Column(String, default="monthly")  # monthly|yearly
    status = Column(String, default="active")          # active|cancelled
    category = Column(String, default="Other")         # Entertainment, Productivity, Gaming, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Reminder tracking
    next_billing_date = Column(DateTime, nullable=True)  # When subscription renews
    reminder_sent = Column(Boolean, default=False)
    last_reminder_date = Column(DateTime, nullable=True)
    
    # Discount and Sharing tracking
    student_discount_applied = Column(Boolean, default=False)
    discount_applied_date = Column(DateTime, nullable=True)
    split_with = Column(Integer, default=1)  # Number of people splitting the cost

    user = relationship("User", back_populates="subscriptions")


# Import StudentDiscount model to register it with Base
from models.student_discount import StudentDiscount

Base.metadata.create_all(bind=engine)


# --- Auth helpers ---
import hashlib
import secrets
import logging

logger = logging.getLogger(__name__)

def hash_password(pw: str) -> str:
    """Hash a password using SHA-256 and a random salt."""
    salt = secrets.token_hex(16)
    combined = (pw + salt).encode("utf-8")
    hashed = hashlib.sha256(combined).hexdigest()
    return f"{salt}${hashed}"


def verify_password(pw: str, hashed: str) -> bool:
    """Verify a password against the salted hash."""
    try:
        if "$" not in hashed:
            return False
        salt, stored_hash = hashed.split("$", 1)
        combined = (pw + salt).encode("utf-8")
        new_hash = hashlib.sha256(combined).hexdigest()
        return secrets.compare_digest(new_hash, stored_hash)
    except Exception:
        return False


def create_access_token(email: str) -> str:
    exp = datetime.utcnow() + timedelta(minutes=JWT_EXPIRES_MIN)
    payload = {"sub": email, "exp": exp}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


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
    category: str = "Other"
    next_billing_date: Optional[datetime] = None
    split_with: int = 1


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    price_cents: Optional[int] = None
    billing_cycle: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    next_billing_date: Optional[datetime] = None
    split_with: Optional[int] = None


class SubscriptionOut(BaseModel):
    id: int
    name: str
    price_cents: int
    billing_cycle: str
    status: str
    category: str = "Other"
    created_at: datetime
    next_billing_date: Optional[datetime] = None
    reminder_sent: bool = False
    student_discount_applied: bool = False
    split_with: int = 1

    class Config:
        from_attributes = True


class VerificationRequest(BaseModel):
    edu_email: EmailStr


app = FastAPI()

# ... (middleware is here, usually)

@app.post("/auth/verify-edu")
async def verify_student_status(
    req: VerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify student status via .edu email.
    """
    if not req.edu_email.lower().endswith(".edu"):
         raise HTTPException(status_code=400, detail="Must be a valid .edu email address")
    
    # Check if already verified
    if current_user.is_verified:
         return {"message": "Already verified", "is_verified": True}

    # Update user
    current_user.edu_email = req.edu_email
    current_user.is_verified = True
    db.commit()
    
    return {"message": "Verification successful", "is_verified": True}


class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_verified: bool
    edu_email: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


@app.get("/users/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from routers.reminders import router as reminder_router
from routers.student_discounts import router as student_discounts_router
from routers.analytics import router as analytics_router
app.include_router(reminder_router)
app.include_router(student_discounts_router)
app.include_router(analytics_router)

# Initialize scheduler on startup
from services.scheduler import reminder_scheduler

@app.on_event("startup")
def startup_event():
    """Initialize services on app startup."""
    reminder_scheduler.set_db_session_maker(SessionLocal)
    reminder_scheduler.start()
    print("Reminder scheduler initialized")

@app.on_event("shutdown")
def shutdown_event():
    """Cleanup on app shutdown."""
    reminder_scheduler.stop()
    print("Reminder scheduler stopped")


@app.get("/health")
def health():
    return {"status": "ok"}


# --- Auth ---
@app.post("/auth/register")
@app.post("/auth/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


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
    import traceback
    try:
        print(f"DEBUG: Creating subscription: {payload}")
        if payload.price_cents < 0:
            raise HTTPException(status_code=400, detail="price_cents must be >= 0")
        if payload.billing_cycle not in ("monthly", "yearly"):
            raise HTTPException(status_code=400, detail="billing_cycle must be 'monthly' or 'yearly'")
        if payload.status not in ("active", "cancelled"):
            raise HTTPException(status_code=400, detail="status must be 'active' or 'cancelled'")

        # Auto-calculate next_billing_date if not provided
        from services.reminder_service import reminder_service
        next_billing_date = payload.next_billing_date
        if not next_billing_date and payload.status == "active":
            next_billing_date = reminder_service.calculate_next_billing_date(
                datetime.utcnow(),
                payload.billing_cycle
            )

        sub = Subscription(
            user_id=current_user.id,
            name=payload.name,
            price_cents=payload.price_cents,
            billing_cycle=payload.billing_cycle,
            status=payload.status,
            category=payload.category,
            next_billing_date=next_billing_date,
            split_with=payload.split_with
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
        return sub
    except Exception:
        traceback.print_exc()
        raise


@app.patch("/subscriptions/{sub_id}", response_model=SubscriptionOut)
def update_subscription(sub_id: int, payload: SubscriptionUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id, Subscription.user_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if payload.price_cents is not None and payload.price_cents < 0:
        raise HTTPException(status_code=400, detail="price_cents must be >= 0")
    if payload.split_with is not None and payload.split_with < 1:
        raise HTTPException(status_code=400, detail="split_with must be >= 1")
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
    if payload.category is not None:
        sub.category = payload.category
    if payload.next_billing_date is not None:
        sub.next_billing_date = payload.next_billing_date
    if payload.split_with is not None:
        sub.split_with = payload.split_with

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
