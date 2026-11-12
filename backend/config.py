"""
Central application settings using Pydantic Settings.
Validates all required env-variables at startup.
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator


class Settings(BaseSettings):
    # ── Environment ──
    environment: str = "production"  # "development" | "production"

    # ── JWT ──
    jwt_secret: str
    jwt_alg: str = "HS256"
    jwt_expires_min: int = 1440  # 24h

    # ── Database ──
    database_url: str = "sqlite:///./subsaver.db"

    # ── URLs ──
    frontend_url: str = "http://localhost:3000"

    # ── CORS ──
    # Accept comma-separated list: "http://localhost:3000,https://your-frontend.example"
    allowed_origins: str = "http://localhost:3000"

    # ── Email / SMTP (optional — server starts even without these) ──
    smtp_host: str = ""
    smtp_port: int = 2525
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@subsaver.example"
    smtp_from_name: str = "SubSaver"

    @field_validator("jwt_secret")
    @classmethod
    def jwt_secret_must_not_be_empty(cls, v: str) -> str:
        if not v or v.strip() == "":
            raise ValueError("JWT_SECRET must be set in .env")
        return v

    def get_allowed_origins(self) -> List[str]:
        """Parse comma-separated ALLOWED_ORIGINS into a list."""
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    def smtp_enabled(self) -> bool:
        """Returns True only if SMTP is properly configured."""
        return bool(self.smtp_host and self.smtp_user and self.smtp_password)

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


# Singleton — import this everywhere
settings = Settings()
