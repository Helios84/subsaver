"""
Security utilities: password hashing, JWT creation/verification.
Extracted from main.py to avoid circular imports.
"""
import hashlib
import secrets
import logging
from datetime import datetime, timedelta

import bcrypt as _bcrypt
from jose import jwt

from config import settings

logger = logging.getLogger(__name__)


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

    # Legacy SHA-256+salt fallback (for users registered before bcrypt migration)
    try:
        if "$" in hashed:
            parts = hashed.split("$", 1)
            if len(parts) == 2 and len(parts[0]) == 32:
                salt, stored_hash = parts
                combined = (pw + salt).encode("utf-8")
                new_hash = hashlib.sha256(combined).hexdigest()
                if secrets.compare_digest(new_hash, stored_hash):
                    return True
    except Exception:
        pass

    return False


def needs_rehash(hashed: str) -> bool:
    """Returns True if the hash is NOT bcrypt (should be migrated on next login)."""
    return not (hashed.startswith("$2b$") or hashed.startswith("$2a$"))


def create_access_token(email: str) -> str:
    exp = datetime.utcnow() + timedelta(minutes=settings.jwt_expires_min)
    payload = {"sub": email, "exp": exp}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)
