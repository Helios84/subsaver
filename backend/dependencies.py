"""Shared FastAPI dependencies — no imports from main.py."""
import logging
from typing import Generator

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from config import settings
from database import SessionLocal
from models.db import User

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def get_db() -> Generator[Session, None, None]:
    """Yield a database session, always closing it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_email(token: str = Depends(oauth2_scheme)) -> str:
    """Decode JWT and extract the user email (sub claim)."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        email: str | None = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(
    db: Session = Depends(get_db),
    email: str = Depends(get_current_email),
) -> User:
    """Return the authenticated User ORM object."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
