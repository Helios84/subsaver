from datetime import datetime, timedelta
from typing import Generator, Optional, List
import os
import hashlib
import secrets
import logging

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
import bcrypt as _bcrypt
from pydantic import BaseModel, EmailStr, constr, field_validator
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from dotenv import load_dotenv
load_dotenv()

# ── Config & Settings ────────────────────────────────────────────────────────
from config import settings

# ── Logging ──────────────────────────────────────────────────────────────────
logger = logging.getLogger(__name__)

# ── Rate Limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── Password hashing (bcrypt direct) ────────────────────────────────────────

def hash_password(pw: str) -> str:
    """Hash a password using bcrypt."""
    return _bcrypt.hashpw(pw.encode("utf-8"), _bcrypt.gensalt(rounds=12)).decode("utf-8")

def verify_password(pw: str, hashed: str) -> bool:
    """Verify a password against a bcrypt or legacy SHA-256 hash."""
    # Try bcrypt first
    try:
        if hashed.startswith("$2b$") or hashed.startswith("$2a$"):
            return _bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        pass

    # Legacy SHA-256+salt fallback (for users registered before this update)
    try:
        if "$" in hashed:
            parts = hashed.split("$", 1)
            if len(parts) == 2 and len(parts[0]) == 32:  # 16-byte hex salt
                salt, stored_hash = parts
                combined = (pw + salt).encode("utf-8")
                new_hash = hashlib.sha256(combined).hexdigest()
                if secrets.compare_digest(new_hash, stored_hash):
                    return True
    except Exception:
        pass

    return False

def needs_rehash(hashed: str) -> bool:
    """Returns True if the hash is NOT a bcrypt hash (should be migrated)."""
    return not (hashed.startswith("$2b$") or hashed.startswith("$2a$"))

def create_access_token(email: str) -> str:
    exp = datetime.utcnow() + timedelta(minutes=settings.jwt_expires_min)
    payload = {"sub": email, "exp": exp}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)

# ── DB setup ──────────────────────────────────────────────────────────────────
from database import engine, SessionLocal, Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Reminder settings
    reminder_enabled = Column(Boolean, default=True)
    reminder_days_before = Column(Integer, default=7)

    # Student Verification
    is_verified = Column(Boolean, default=False)
    edu_email = Column(String, nullable=True)
    verification_code = Column(String, nullable=True)
    verification_code_expires = Column(DateTime, nullable=True)
    
    # Password Reset
    reset_code = Column(String, nullable=True)
    reset_expires = Column(DateTime, nullable=True)

    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)

    name = Column(String, nullable=False)
    price_cents = Column(Integer, nullable=False)
    billing_cycle = Column(String, default="monthly")
    status = Column(String, default="active")
    category = Column(String, default="Other")
    created_at = Column(DateTime, default=datetime.utcnow)

    next_billing_date = Column(DateTime, nullable=True)
    reminder_sent = Column(Boolean, default=False)
    last_reminder_date = Column(DateTime, nullable=True)

    student_discount_applied = Column(Boolean, default=False)
    discount_applied_date = Column(DateTime, nullable=True)
    split_with = Column(Integer, default=1)

    user = relationship("User", back_populates="subscriptions")


from models.student_discount import StudentDiscount
Base.metadata.create_all(bind=engine)

# ── Pydantic Schemas ──────────────────────────────────────────────────────────

BILLING_CYCLES = {"monthly", "yearly"}
STATUSES = {"active", "cancelled"}
CATEGORIES = {"Entertainment", "Productivity", "Gaming", "Health", "Education", "Finance", "Other"}


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str

    @field_validator("code")
    @classmethod
    def code_format(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Reset code must be exactly 6 digits")
        return v


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("code")
    @classmethod
    def code_format(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Reset code must be exactly 6 digits")
        return v


class SubscriptionCreate(BaseModel):
    name: str
    price_cents: int
    billing_cycle: str = "monthly"
    status: str = "active"
    category: str = "Other"
    next_billing_date: Optional[datetime] = None
    split_with: int = 1

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be empty")
        if len(v) > 100:
            raise ValueError("name must be at most 100 characters")
        return v

    @field_validator("price_cents")
    @classmethod
    def price_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("price_cents must be >= 0")
        return v

    @field_validator("billing_cycle")
    @classmethod
    def billing_cycle_valid(cls, v: str) -> str:
        if v not in BILLING_CYCLES:
            raise ValueError(f"billing_cycle must be one of {BILLING_CYCLES}")
        return v

    @field_validator("status")
    @classmethod
    def status_valid(cls, v: str) -> str:
        if v not in STATUSES:
            raise ValueError(f"status must be one of {STATUSES}")
        return v

    @field_validator("category")
    @classmethod
    def category_valid(cls, v: str) -> str:
        if v not in CATEGORIES:
            return "Other"
        return v

    @field_validator("split_with")
    @classmethod
    def split_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("split_with must be >= 1")
        return v


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    price_cents: Optional[int] = None
    billing_cycle: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    next_billing_date: Optional[datetime] = None
    split_with: Optional[int] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("name must not be empty")
            if len(v) > 100:
                raise ValueError("name must be at most 100 characters")
        return v

    @field_validator("price_cents")
    @classmethod
    def price_non_negative(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("price_cents must be >= 0")
        return v

    @field_validator("billing_cycle")
    @classmethod
    def billing_cycle_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in BILLING_CYCLES:
            raise ValueError(f"billing_cycle must be one of {BILLING_CYCLES}")
        return v

    @field_validator("status")
    @classmethod
    def status_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in STATUSES:
            raise ValueError(f"status must be one of {STATUSES}")
        return v

    @field_validator("category")
    @classmethod
    def category_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in CATEGORIES:
            return "Other"
        return v

    @field_validator("split_with")
    @classmethod
    def split_positive(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 1:
            raise ValueError("split_with must be >= 1")
        return v


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

    @field_validator("edu_email")
    @classmethod
    def must_be_edu(cls, v: str) -> str:
        if not v.lower().endswith(".edu"):
            raise ValueError("Must be a valid .edu email address")
        return v.lower()


class VerificationConfirmRequest(BaseModel):
    code: str

    @field_validator("code")
    @classmethod
    def code_format(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Verification code must be exactly 6 digits")
        return v


class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_verified: bool
    edu_email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(title="SubSaver API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Dependencies ──────────────────────────────────────────────────────────────
from dependencies import get_db, get_current_email, get_current_user

# ── Routers ───────────────────────────────────────────────────────────────────
from routers.reminders import router as reminder_router
from routers.student_discounts import router as student_discounts_router
from routers.analytics import router as analytics_router
app.include_router(reminder_router)
app.include_router(student_discounts_router)
app.include_router(analytics_router)

# ── Scheduler ────────────────────────────────────────────────────────────────
from services.scheduler import reminder_scheduler

@app.on_event("startup")
def startup_event():
    reminder_scheduler.set_db_session_maker(SessionLocal)
    reminder_scheduler.start()
    logger.info("✅ Reminder scheduler started")

@app.on_event("shutdown")
def shutdown_event():
    reminder_scheduler.stop()
    logger.info("Reminder scheduler stopped")


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/auth/register")
@limiter.limit("3/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        email = payload.email.strip().lower()

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
        raise HTTPException(status_code=500, detail="Registration failed")


@app.post("/auth/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Transparent migration: re-hash legacy SHA-256 passwords to bcrypt
    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(payload.password)
        db.commit()
        logger.info(f"Password re-hashed to bcrypt for user {email}")

    return {"access_token": create_access_token(email), "token_type": "bearer"}


# ── No-auth verification endpoints (used during registration, before login) ──

class VerifyRegistrationRequest(BaseModel):
    email: EmailStr
    code: str

    @field_validator("code")
    @classmethod
    def code_format(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Verification code must be exactly 6 digits")
        return v


@app.post("/auth/verify-registration")
@limiter.limit("10/minute")
def verify_registration(request: Request, payload: VerifyRegistrationRequest, db: Session = Depends(get_db)):
    """
    Confirm the .edu verification code during registration (no JWT required).
    Called from the register page Step 2.
    """
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.is_verified:
        return {"message": "Already verified"}

    if not user.verification_code or not user.verification_code_expires:
        raise HTTPException(status_code=400, detail="No verification code found. Please register again.")

    if datetime.utcnow() > user.verification_code_expires:
        user.verification_code = None
        user.verification_code_expires = None
        db.commit()
        raise HTTPException(status_code=400, detail="Verification code expired. Please request a new one.")

    if not secrets.compare_digest(user.verification_code, payload.code):
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    # Success
    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires = None
    db.commit()

    return {"message": "Email verified successfully! You can now log in."}


class ResendVerificationRequest(BaseModel):
    email: EmailStr


@app.post("/auth/resend-verification")
@limiter.limit("3/minute")
def resend_verification(request: Request, payload: ResendVerificationRequest, db: Session = Depends(get_db)):
    """Resend verification code to the stored edu_email for a pending user."""
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.is_verified:
        return {"message": "Already verified"}
    if not user.edu_email:
        raise HTTPException(status_code=400, detail="No .edu email on file. Please register again.")

    code = str(secrets.randbelow(900000) + 100000)
    user.verification_code = code
    user.verification_code_expires = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    from services.email_service import email_service
    sent = email_service.send_verification_code(user.edu_email, code)
    if not sent:
        logger.warning(f"SMTP disabled. Resend code for {user.edu_email}: {code}")
        return {"message": "Code resent", "dev_code": code, "expires_in_minutes": 15}

    return {"message": f"Code resent to {user.edu_email}", "expires_in_minutes": 15}


@app.post("/auth/token", response_model=TokenResponse)
@limiter.limit("5/minute")
def token(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 Password Flow (for Swagger Authorize)."""
    email = form.username.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": create_access_token(email), "token_type": "bearer"}


@app.post("/auth/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Prevent email enumeration by always returning the same success message
        return {"message": "If that email exists, a reset code has been sent."}
        
    code = str(secrets.randbelow(900000) + 100000)
    user.reset_code = code
    user.reset_expires = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    
    from services.email_service import email_service
    sent = email_service.send_password_reset_code(user.email, code)
        
    if not sent:
        logger.warning(f"SMTP disabled. Reset code for {user.email}: {code}")
        return {"message": "If that email exists, a reset code has been sent.", "dev_code": code}

    return {"message": "If that email exists, a reset code has been sent."}


@app.post("/auth/verify-reset-code")
@limiter.limit("5/minute")
def verify_reset_code(request: Request, payload: VerifyResetCodeRequest, db: Session = Depends(get_db)):
    """
    Step 2 of Forgot Password flow: verifies the 6-digit code before allowing new password input.
    """
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid request")
        
    if not user.reset_code or not user.reset_expires:
        raise HTTPException(status_code=400, detail="No pending reset request")
        
    if datetime.utcnow() > user.reset_expires:
        raise HTTPException(status_code=400, detail="Reset code expired")
        
    if not secrets.compare_digest(user.reset_code, payload.code):
        raise HTTPException(status_code=400, detail="Invalid reset code")
        
    return {"message": "Code verified"}


@app.post("/auth/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid request")
        
    if not user.reset_code or not user.reset_expires:
        raise HTTPException(status_code=400, detail="No pending reset request")
        
    if datetime.utcnow() > user.reset_expires:
        user.reset_code = None
        user.reset_expires = None
        db.commit()
        raise HTTPException(status_code=400, detail="Reset code expired")
        
    if not secrets.compare_digest(user.reset_code, payload.code):
        raise HTTPException(status_code=400, detail="Invalid reset code")
        
    # Apply new password
    user.password_hash = hash_password(payload.new_password)
    user.reset_code = None
    user.reset_expires = None
    db.commit()
    
    from services.email_service import email_service
    # Send notification of successful password change
    email_service.send_password_changed_notification(user.email)
    
    return {"message": "Password has been successfully reset"}


@app.get("/me")
def me(current_email: str = Depends(get_current_email)):
    return {"email": current_email}


# ── Student Verification (real 2-step with email code) ────────────────────────

@app.post("/auth/verify-edu")
async def request_verification_code(
    req: VerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        if current_user.is_verified:
            return {"message": "Already verified", "is_verified": True}

        code = str(secrets.randbelow(900000) + 100000)
        expires_at = datetime.utcnow() + timedelta(minutes=15)

        current_user.edu_email = req.edu_email
        current_user.verification_code = code
        current_user.verification_code_expires = expires_at
        db.commit()

        from services.email_service import email_service
        sent_edu = email_service.send_verification_code(req.edu_email, code)

        sent_main = False
        if current_user.email.lower() != req.edu_email.lower():
            sent_main = email_service.send_verification_code(current_user.email, code)

        actually_sent = sent_edu or sent_main

        if not actually_sent:
            logger.warning(f"SMTP disabled. Verification code: {code}")
            return {
                "message": "SMTP not configured. Use the code from server logs for testing.",
                "dev_code": code,
                "expires_in_minutes": 15,
            }

        return {
            "message": f"Verification code sent to {req.edu_email} and {current_user.email}. Check both inboxes.",
            "expires_in_minutes": 15,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auth/verify-edu/confirm")
async def confirm_verification_code(
    req: VerificationConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Step 2: Confirm the verification code received via email.
    """
    if current_user.is_verified:
        return {"message": "Already verified", "is_verified": True}

    # Check code exists
    if not current_user.verification_code or not current_user.verification_code_expires:
        raise HTTPException(
            status_code=400,
            detail="No verification code found. Please request a new one.",
        )

    # Check expiry
    if datetime.utcnow() > current_user.verification_code_expires:
        current_user.verification_code = None
        current_user.verification_code_expires = None
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired. Please request a new one.",
        )

    # Check code matches
    if not secrets.compare_digest(current_user.verification_code, req.code):
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    # Success!
    current_user.is_verified = True
    current_user.verification_code = None
    current_user.verification_code_expires = None
    db.commit()

    return {"message": "Student status verified successfully!", "is_verified": True}


# ── User Profile ──────────────────────────────────────────────────────────────

@app.get("/users/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


# ── Subscriptions CRUD ────────────────────────────────────────────────────────

@app.get("/subscriptions", response_model=List[SubscriptionOut])
def list_subscriptions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
        .all()
    )


@app.post("/subscriptions", response_model=SubscriptionOut)
def create_subscription(
    payload: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import traceback
    try:
        from services.reminder_service import reminder_service
        next_billing_date = payload.next_billing_date
        if not next_billing_date and payload.status == "active":
            next_billing_date = reminder_service.calculate_next_billing_date(
                datetime.utcnow(), payload.billing_cycle
            )

        sub = Subscription(
            user_id=current_user.id,
            name=payload.name,
            price_cents=payload.price_cents,
            billing_cycle=payload.billing_cycle,
            status=payload.status,
            category=payload.category,
            next_billing_date=next_billing_date,
            split_with=payload.split_with,
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
        return sub
    except Exception:
        traceback.print_exc()
        raise


@app.patch("/subscriptions/{sub_id}", response_model=SubscriptionOut)
def update_subscription(
    sub_id: int,
    payload: SubscriptionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = db.query(Subscription).filter(
        Subscription.id == sub_id, Subscription.user_id == current_user.id
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if payload.price_cents is not None and payload.price_cents < 0:
        raise HTTPException(status_code=400, detail="price_cents must be >= 0")
    if payload.split_with is not None and payload.split_with < 1:
        raise HTTPException(status_code=400, detail="split_with must be >= 1")
    if payload.billing_cycle is not None and payload.billing_cycle not in BILLING_CYCLES:
        raise HTTPException(status_code=400, detail=f"billing_cycle must be one of {BILLING_CYCLES}")
    if payload.status is not None and payload.status not in STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {STATUSES}")

    if payload.name is not None:
        sub.name = payload.name.strip()
    if payload.price_cents is not None:
        sub.price_cents = payload.price_cents
    if payload.billing_cycle is not None:
        sub.billing_cycle = payload.billing_cycle
    if payload.status is not None:
        sub.status = payload.status
    if payload.category is not None:
        sub.category = payload.category if payload.category in CATEGORIES else "Other"
    if payload.next_billing_date is not None:
        sub.next_billing_date = payload.next_billing_date
    if payload.split_with is not None:
        sub.split_with = payload.split_with

    db.commit()
    db.refresh(sub)
    return sub


@app.delete("/subscriptions/{sub_id}")
def delete_subscription(
    sub_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = db.query(Subscription).filter(
        Subscription.id == sub_id, Subscription.user_id == current_user.id
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    db.delete(sub)
    db.commit()
    return {"message": "deleted"}
