"""
Pydantic schemas for authentication endpoints.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


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


class ConfirmEmailRequest(BaseModel):
    """Schema for POST /auth/confirm-email — verifying registration code."""
    email: EmailStr
    code: str

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Confirmation code must be exactly 6 digits")
        return v


class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_verified: bool
    email_confirmed: bool
    edu_email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
