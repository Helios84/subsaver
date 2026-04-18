"""Auth router — all /auth/* endpoints."""
import secrets
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from dependencies import get_db, get_current_user
from models.db import User
from schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    ForgotPasswordRequest, VerifyResetCodeRequest, ResetPasswordRequest,
    VerificationRequest, VerificationConfirmRequest,
    VerifyRegistrationRequest, ResendVerificationRequest, UserOut,
    ConfirmEmailRequest,
)
from core.security import hash_password, verify_password, needs_rehash, create_access_token
from limiter import limiter
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["auth"])


@router.post("/auth/register")
@limiter.limit("10/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        email = payload.email.strip().lower()
        existing = db.query(User).filter(User.email == email).first()

        if existing:
            # If already confirmed → reject
            if existing.email_confirmed:
                raise HTTPException(status_code=400, detail="User already exists")
            # If unconfirmed but code is still valid → tell them to check email
            if (
                existing.verification_code
                and existing.verification_code_expires
                and datetime.now(timezone.utc).replace(tzinfo=None) < existing.verification_code_expires
            ):
                raise HTTPException(
                    status_code=400,
                    detail="Account already registered. Check your email for the confirmation code."
                )
            # Unconfirmed + expired code → allow re-registration (update existing row)
            code = str(secrets.randbelow(900000) + 100000)
            existing.password_hash = hash_password(payload.password)
            existing.verification_code = code
            existing.verification_code_expires = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=15)
            db.commit()
            from services.email_service import email_service
            sent = email_service.send_email_confirmation(email, code)
            if not sent:
                logger.warning(f"SMTP disabled. Re-registration code for {email}: {code}")
                if settings.environment == "development":
                    return {"message": "registered", "dev_code": code}
            return {"message": "registered"}

        # New user
        code = str(secrets.randbelow(900000) + 100000)
        user = User(
            email=email,
            password_hash=hash_password(payload.password),
            email_confirmed=False,
            verification_code=code,
            verification_code_expires=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=15),
        )
        db.add(user)
        db.commit()
        from services.email_service import email_service
        sent = email_service.send_email_confirmation(email, code)
        if not sent:
            logger.warning(f"SMTP disabled. Email confirmation code for {email}: {code}")
            if settings.environment == "development":
                return {"message": "registered", "dev_code": code}
        return {"message": "registered"}
    except HTTPException:
        raise
    except Exception as e:
        import traceback as _tb
        logger.error(f"Registration error: {e}\n{_tb.format_exc()}")
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/auth/confirm-email")
@limiter.limit("5/minute")
def confirm_email(request: Request, payload: ConfirmEmailRequest, db: Session = Depends(get_db)):
    """Verify the 6-digit code sent after registration to confirm the user's email."""
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.email_confirmed:
        return {"message": "Already confirmed"}
    if not user.verification_code or not user.verification_code_expires:
        raise HTTPException(status_code=400, detail="No confirmation code found. Please register again.")
    if datetime.now(timezone.utc).replace(tzinfo=None) > user.verification_code_expires:
        user.verification_code = None
        user.verification_code_expires = None
        db.commit()
        raise HTTPException(status_code=400, detail="Confirmation code expired. Please request a new one.")
    if not secrets.compare_digest(user.verification_code, payload.code):
        raise HTTPException(status_code=400, detail="Invalid confirmation code")
    user.email_confirmed = True
    user.verification_code = None
    user.verification_code_expires = None
    db.commit()
    return {"message": "Email confirmed successfully! You can now log in."}


@router.post("/auth/resend-confirmation")
@limiter.limit("3/minute")
def resend_confirmation(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Resend email confirmation code for unconfirmed accounts."""
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"message": "If that email exists, a code has been sent."}
    if user.email_confirmed:
        return {"message": "Already confirmed"}
    code = str(secrets.randbelow(900000) + 100000)
    user.verification_code = code
    user.verification_code_expires = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=15)
    db.commit()
    from services.email_service import email_service
    sent = email_service.send_email_confirmation(email, code)
    if not sent:
        if settings.environment == "development":
            return {"message": "Code sent", "dev_code": code}
    return {"message": "Confirmation code resent to your email"}


@router.post("/auth/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.email_confirmed:
        raise HTTPException(
            status_code=403,
            detail="email_not_confirmed",
        )
    # Transparent bcrypt upgrade
    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(payload.password)
        db.commit()
        logger.info(f"Password re-hashed to bcrypt for {email}")
    return {"access_token": create_access_token(email), "token_type": "bearer"}


@router.post("/auth/token", response_model=TokenResponse)
def token(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 Password Flow (for Swagger Authorize)."""
    email = form.username.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.email_confirmed:
        raise HTTPException(status_code=403, detail="email_not_confirmed")
    return {"access_token": create_access_token(email), "token_type": "bearer"}


@router.post("/auth/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"message": "If that email exists, a reset code has been sent."}
    code = str(secrets.randbelow(900000) + 100000)
    user.reset_code = code
    user.reset_expires = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=15)
    db.commit()
    from services.email_service import email_service
    sent = email_service.send_password_reset_code(user.email, code)
    if not sent:
        logger.warning(f"SMTP disabled. Reset code for {user.email}: {code}")
        if settings.environment == "development":
            return {"message": "If that email exists, a reset code has been sent.", "dev_code": code}
    return {"message": "If that email exists, a reset code has been sent."}


@router.post("/auth/verify-reset-code")
def verify_reset_code(request: Request, payload: VerifyResetCodeRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.reset_code or not user.reset_expires:
        raise HTTPException(status_code=400, detail="Invalid request")
    if datetime.now(timezone.utc).replace(tzinfo=None) > user.reset_expires:
        raise HTTPException(status_code=400, detail="Reset code expired")
    if not secrets.compare_digest(user.reset_code, payload.code):
        raise HTTPException(status_code=400, detail="Invalid reset code")
    return {"message": "Code verified"}


@router.post("/auth/reset-password")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.reset_code or not user.reset_expires:
        raise HTTPException(status_code=400, detail="Invalid request")
    if datetime.now(timezone.utc).replace(tzinfo=None) > user.reset_expires:
        user.reset_code = None
        user.reset_expires = None
        db.commit()
        raise HTTPException(status_code=400, detail="Reset code expired")
    if not secrets.compare_digest(user.reset_code, payload.code):
        raise HTTPException(status_code=400, detail="Invalid reset code")
    user.password_hash = hash_password(payload.new_password)
    user.reset_code = None
    user.reset_expires = None
    db.commit()
    from services.email_service import email_service
    email_service.send_password_changed_notification(user.email)
    return {"message": "Password has been successfully reset"}


@router.post("/auth/verify-registration")
def verify_registration(request: Request, payload: VerifyRegistrationRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.is_verified:
        return {"message": "Already verified"}
    if not user.verification_code or not user.verification_code_expires:
        raise HTTPException(status_code=400, detail="No verification code found.")
    if datetime.now(timezone.utc).replace(tzinfo=None) > user.verification_code_expires:
        user.verification_code = None
        user.verification_code_expires = None
        db.commit()
        raise HTTPException(status_code=400, detail="Verification code expired.")
    if not secrets.compare_digest(user.verification_code, payload.code):
        raise HTTPException(status_code=400, detail="Invalid verification code.")
    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires = None
    db.commit()
    return {"message": "Email verified successfully! You can now log in."}


@router.post("/auth/resend-verification")
@limiter.limit("3/minute")
def resend_verification(request: Request, payload: ResendVerificationRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.is_verified:
        return {"message": "Already verified"}
    if not user.edu_email:
        raise HTTPException(status_code=400, detail="No .edu email on file.")
    code = str(secrets.randbelow(900000) + 100000)
    user.verification_code = code
    user.verification_code_expires = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=15)
    db.commit()
    from services.email_service import email_service
    sent = email_service.send_verification_code(user.edu_email, code)
    if not sent:
        if settings.environment == "development":
            return {"message": "Code resent", "dev_code": code, "expires_in_minutes": 15}
    return {"message": f"Code resent to {user.edu_email}", "expires_in_minutes": 15}


@router.post("/auth/verify-edu")
@limiter.limit("5/minute")
async def request_verification_code(
    request: Request,
    req: VerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        if current_user.is_verified:
            return {"message": "Already verified", "is_verified": True}
        code = str(secrets.randbelow(900000) + 100000)
        expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=15)
        current_user.edu_email = req.edu_email
        current_user.verification_code = code
        current_user.verification_code_expires = expires_at
        db.commit()
        from services.email_service import email_service
        sent_edu = email_service.send_verification_code(req.edu_email, code)
        sent_main = False
        if current_user.email.lower() != req.edu_email.lower():
            sent_main = email_service.send_verification_code(current_user.email, code)
        if not (sent_edu or sent_main):
            logger.warning(f"SMTP disabled. Verification code: {code}")
            if settings.environment == "development":
                return {"message": "SMTP not configured.", "dev_code": code, "expires_in_minutes": 15}
            return {"message": f"Code sent to {req.edu_email}.", "expires_in_minutes": 15}
        return {"message": f"Code sent to {req.edu_email}.", "expires_in_minutes": 15}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/verify-edu/confirm")
async def confirm_verification_code(
    req: VerificationConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.is_verified:
        return {"message": "Already verified", "is_verified": True}
    if not current_user.verification_code or not current_user.verification_code_expires:
        raise HTTPException(status_code=400, detail="No verification code found.")
    if datetime.now(timezone.utc).replace(tzinfo=None) > current_user.verification_code_expires:
        current_user.verification_code = None
        current_user.verification_code_expires = None
        db.commit()
        raise HTTPException(status_code=400, detail="Verification code expired.")
    if not secrets.compare_digest(current_user.verification_code, req.code):
        raise HTTPException(status_code=400, detail="Invalid verification code.")
    current_user.is_verified = True
    current_user.verification_code = None
    current_user.verification_code_expires = None
    db.commit()
    return {"message": "Student status verified successfully!", "is_verified": True}


@router.get("/me")
def me_email(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email}


@router.get("/users/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.delete("/users/me", status_code=204)
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently delete the current user's account and all associated data."""
    db.delete(current_user)
    db.commit()
