"""
ORM models for User and Subscription.
Extracted from main.py so all modules can import without circular imports.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from database import Base


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

    # Email confirmation (required at registration)
    email_confirmed = Column(Boolean, default=False, nullable=False)

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
    cancelled_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="subscriptions")
