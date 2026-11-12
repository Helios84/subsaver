"""
Security utilities: password hashing, JWT creation/verification.
Extracted from main.py to avoid circular imports.
"""
import hashlib
import secrets
import logging
from datetime import datetime, timedelta, timezone

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
    """Create a JWT access token with a unique jti for blacklist support."""
    exp = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=settings.jwt_expires_min)
    jti = secrets.token_hex(16)  # unique token ID — used for blacklist
    payload = {"sub": email, "exp": exp, "jti": jti}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)


def decode_token(token: str) -> dict:
    """Decode a JWT and return its payload dict. Raises JWTError on failure."""
    from jose import jwt as _jwt
    return _jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
