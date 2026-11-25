"""Auth router — all /auth/* endpoints."""
import secrets
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt as _jwt, JWTError
from pydantic import BaseModel
from sqlalchemy.orm import Session

from dependencies import get_db, get_current_user
from models.db import User, RevokedToken
from schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    ForgotPasswordRequest, VerifyResetCodeRequest, ResetPasswordRequest,
    VerificationRequest, VerificationConfirmRequest, UserOut,
    ConfirmEmailRequest,
)
from core.security import hash_password, verify_password, needs_rehash, create_access_token
from limiter import limiter
from services.demo_service import create_demo_user
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["auth"])


def _forbid_demo(user: User | None, action: str) -> None:
    """Demo accounts are temporary and have placeholder addresses, so account actions are blocked."""
    if user is not None and user.is_demo:
        raise HTTPException(status_code=403, detail=f"{action} is not available for demo accounts")


def _log_unsent_code(kind: str, email: str, code: str) -> None:
    """Report that a code email was not sent.

    The code itself is written to the log only in development, so a local
    setup without SMTP stays usable. In production the log never contains codes.
    """
    if settings.environment == "development":
        logger.warning(f"Email not sent. {kind} code for {email}: {code}")
    else:
        logger.warning(f"Email not sent ({kind} code) for {email}")


# ─── Helper: revoke a token by jti ───────────────────────────────────────────
def _revoke_token(token: str, db: Session) -> None:
    """Decode token and add its jti to the revoked_tokens table."""
    try:
        payload = _jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and exp:
            expires_at = datetime.fromtimestamp(exp)
            if not db.query(RevokedToken).filter(RevokedToken.jti == jti).first():
                db.add(RevokedToken(jti=jti, expires_at=expires_at))
                db.commit()
    except JWTError:
        pass  # token already invalid — no action needed


# ═══════════════════════════════════════════════════════════════════════════════
# REGISTER
# ═══════════════════════════════════════════════════════════════════════════════
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
                _log_unsent_code("Re-registration", email, code)
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
            _log_unsent_code("Email confirmation", email, code)
        return {"message": "registered"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")


# ═══════════════════════════════════════════════════════════════════════════════
# EMAIL CONFIRMATION
# ═══════════════════════════════════════════════════════════════════════════════
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
        _log_unsent_code("Resend confirmation", email, code)
    return {"message": "Confirmation code resent to your email"}


# ═══════════════════════════════════════════════════════════════════════════════
# LOGIN / LOGOUT
# ═══════════════════════════════════════════════════════════════════════════════
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
@limiter.limit("10/minute")
def token(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 Password Flow (for Swagger Authorize)."""
    email = form.username.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.email_confirmed:
        raise HTTPException(status_code=403, detail="email_not_confirmed")
    return {"access_token": create_access_token(email), "token_type": "bearer"}


@router.post("/auth/demo-login", response_model=TokenResponse)
@limiter.limit("10/hour")
def demo_login(request: Request, db: Session = Depends(get_db)):
    """Create a private temporary demo account and sign in to it (only when DEMO_ENABLED=true)."""
    if not settings.demo_enabled:
        raise HTTPException(status_code=404, detail="Demo account is not enabled")
    try:
        user = create_demo_user(db)
    except Exception:
        db.rollback()
        logger.exception("Failed to create demo account")
        raise HTTPException(status_code=500, detail="Could not start the demo")
    return {"access_token": create_access_token(user.email), "token_type": "bearer"}


@router.post("/auth/logout")
@limiter.limit("20/minute")
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke the current JWT so it can no longer be used."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token_str = auth_header[7:]
        _revoke_token(token_str, db)
    return {"message": "Logged out successfully"}


# ═══════════════════════════════════════════════════════════════════════════════
# PASSWORD RESET
# ═══════════════════════════════════════════════════════════════════════════════
@router.post("/auth/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    _forbid_demo(user, "Password reset")
    if not user:
        return {"message": "If that email exists, a reset code has been sent."}
    code = str(secrets.randbelow(900000) + 100000)
    user.reset_code = code
    user.reset_expires = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=15)
    db.commit()
    from services.email_service import email_service
    sent = email_service.send_password_reset_code(user.email, code)
    if not sent:
        _log_unsent_code("Reset", user.email, code)
    return {"message": "If that email exists, a reset code has been sent."}


@router.post("/auth/verify-reset-code")
@limiter.limit("5/minute")
def verify_reset_code(request: Request, payload: VerifyResetCodeRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    _forbid_demo(user, "Password reset")
    if not user or not user.reset_code or not user.reset_expires:
        raise HTTPException(status_code=400, detail="Invalid request")
    if datetime.now(timezone.utc).replace(tzinfo=None) > user.reset_expires:
        raise HTTPException(status_code=400, detail="Reset code expired")
    if not secrets.compare_digest(user.reset_code, payload.code):
        raise HTTPException(status_code=400, detail="Invalid reset code")
    return {"message": "Code verified"}


@router.post("/auth/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    _forbid_demo(user, "Password reset")
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


# ═══════════════════════════════════════════════════════════════════════════════
# STUDENT .EDU VERIFICATION (uses separate edu_verification_code fields)
# ═══════════════════════════════════════════════════════════════════════════════
@router.post("/auth/verify-edu")
@limiter.limit("5/minute")
async def request_verification_code(
    request: Request,
    req: VerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _forbid_demo(current_user, "Student verification")
    try:
        if current_user.is_verified:
            return {"message": "Already verified", "is_verified": True}
        code = str(secrets.randbelow(900000) + 100000)
        expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=15)
        current_user.edu_email = req.edu_email
        # Use dedicated edu_verification_code fields (no conflict with registration code)
        current_user.edu_verification_code = code
        current_user.edu_verification_code_expires = expires_at
        db.commit()
        from services.email_service import email_service
        # Send only to the .edu address: receiving the code is the proof of ownership.
        sent = email_service.send_verification_code(req.edu_email, code)
        if not sent:
            _log_unsent_code("EDU verification", req.edu_email, code)
        return {"message": f"Code sent to {req.edu_email}.", "expires_in_minutes": 15}
    except Exception:
        db.rollback()
        logger.exception("EDU verification error")
        raise HTTPException(status_code=500, detail="Could not start student verification")


@router.post("/auth/verify-edu/confirm")
@limiter.limit("10/minute")
async def confirm_verification_code(
    request: Request,
    req: VerificationConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _forbid_demo(current_user, "Student verification")
    if current_user.is_verified:
        return {"message": "Already verified", "is_verified": True}
    # Use dedicated edu_verification_code fields
    if not current_user.edu_verification_code or not current_user.edu_verification_code_expires:
        raise HTTPException(status_code=400, detail="No verification code found.")
    if datetime.now(timezone.utc).replace(tzinfo=None) > current_user.edu_verification_code_expires:
        current_user.edu_verification_code = None
        current_user.edu_verification_code_expires = None
        db.commit()
        raise HTTPException(status_code=400, detail="Verification code expired.")
    if not secrets.compare_digest(current_user.edu_verification_code, req.code):
        raise HTTPException(status_code=400, detail="Invalid verification code.")
    current_user.is_verified = True
    current_user.edu_verification_code = None
    current_user.edu_verification_code_expires = None
    db.commit()
    return {"message": "Student status verified successfully!", "is_verified": True}


# ═══════════════════════════════════════════════════════════════════════════════
# USER PROFILE
# ═══════════════════════════════════════════════════════════════════════════════
@router.get("/users/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


class DeleteAccountRequest(BaseModel):
    password: str


@router.delete("/users/me", status_code=204)
def delete_account(
    payload: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently delete the current user's account and all associated data.
    Requires password confirmation to prevent accidental/unauthorized deletion.
    """
    _forbid_demo(current_user, "Account deletion")
    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(status_code=403, detail="Incorrect password")
    db.delete(current_user)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# USER PREFERENCES
# ═══════════════════════════════════════════════════════════════════════════════
class PreferencesPayload(BaseModel):
    preferences: str  # JSON string from frontend


@router.get("/users/me/preferences")
def get_preferences(current_user: User = Depends(get_current_user)):
    """Return saved dashboard preferences (JSON string)."""
    return {"preferences": current_user.dashboard_preferences or ""}


@router.patch("/users/me/preferences")
def update_preferences(
    payload: PreferencesPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save dashboard preferences JSON string to the database."""
    current_user.dashboard_preferences = payload.preferences
    db.commit()
    return {"message": "Preferences saved"}
