"""
Pydantic schemas for subscriptions.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator

BILLING_CYCLES = {"monthly", "yearly"}
STATUSES = {"active", "cancelled", "trial", "paused"}
CATEGORIES = {
    "Entertainment", "Productivity", "Gaming",
    "Health", "Education", "Finance", "Other",
    "Utilities", "Communication", "Health & Fitness",
    "Food & Delivery", "News & Media",
}


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
        if v > 10_000_000:
            raise ValueError("price_cents must be <= 10000000 (~$100,000)")
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
        if v is not None and v > 10_000_000:
            raise ValueError("price_cents must be <= 10000000 (~$100,000)")
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
    cancelled_at: Optional[datetime] = None
    reminder_sent: bool = False
    student_discount_applied: bool = False
    split_with: int = 1

    model_config = ConfigDict(from_attributes=True)
