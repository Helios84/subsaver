"""Temporary demo accounts.

Each visitor who opens the demo gets a private account filled with sample
subscriptions. Accounts have no usable password (the only way in is
POST /auth/demo-login) and are deleted by a scheduled job after 24 hours.
All subscriptions below are made-up sample data.
"""
import logging
import secrets
from datetime import datetime, timedelta, timezone

from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Session

from config import settings
from core.security import hash_password
from models.db import User, Subscription

logger = logging.getLogger(__name__)

# Reserved example domain: these addresses can never receive mail.
DEMO_EMAIL_DOMAIN = "subsaver.example"
DEMO_MAX_AGE = timedelta(hours=24)

# name, price_cents, cycle, category, split_with, months since added, days until next charge
_ACTIVE = [
    ("Spotify",          699, "monthly", "Entertainment",    1, 5,   4),
    ("Netflix",         1549, "monthly", "Entertainment",    3, 6,  11),
    ("YouTube Premium", 1599, "monthly", "Entertainment",    2, 1,  19),
    ("iCloud+",          299, "monthly", "Utilities",        1, 6,   7),
    ("ChatGPT Plus",    2000, "monthly", "Productivity",     1, 3,  23),
    ("Xbox Game Pass",   999, "monthly", "Gaming",           1, 4,  15),
    ("Campus Gym",      2500, "monthly", "Health & Fitness", 1, 2,   2),
    ("Duolingo",        5999, "yearly",  "Education",        1, 5, 140),
    ("The Daily Paper",  400, "monthly", "News & Media",     1, 2,  27),
]
# One subscription that was cancelled two months ago, so trends show a drop.
_CANCELLED = ("Hulu", 1199, "monthly", "Entertainment", 1, 6)
# The subscription shown with a student price already applied, and what it cost before.
_DISCOUNTED = "Spotify"
_DISCOUNTED_ORIGINAL_CENTS = 1299


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _delete_users(db: Session, users: list[User]) -> int:
    # Delete through the ORM so each user's subscriptions are removed by the cascade.
    for user in users:
        db.delete(user)
    return len(users)


def _seed_subscriptions(db: Session, user: User, now: datetime) -> None:
    for name, price, cycle, category, split, months_ago, due_in_days in _ACTIVE:
        discounted = name == _DISCOUNTED
        added = now - relativedelta(months=months_ago)
        db.add(Subscription(
            user_id=user.id,
            name=name,
            price_cents=price,
            billing_cycle=cycle,
            status="active",
            category=category,
            split_with=split,
            created_at=added,
            next_billing_date=now + timedelta(days=due_in_days),
            student_discount_applied=discounted,
            discount_applied_date=added if discounted else None,
            original_price_cents=_DISCOUNTED_ORIGINAL_CENTS if discounted else None,
        ))

    name, price, cycle, category, split, months_ago = _CANCELLED
    db.add(Subscription(
        user_id=user.id,
        name=name,
        price_cents=price,
        billing_cycle=cycle,
        status="cancelled",
        category=category,
        split_with=split,
        created_at=now - relativedelta(months=months_ago),
        cancelled_at=now - relativedelta(months=2),
        next_billing_date=None,
    ))


def create_demo_user(db: Session) -> User:
    """Create a new private demo account with the sample subscriptions."""
    now = _now()

    # Keep the number of live demo accounts bounded: drop the oldest ones first.
    live = db.query(User).filter(User.is_demo == True).count()  # noqa: E712
    excess = live - settings.demo_max_users + 1
    if excess > 0:
        oldest = (
            db.query(User).filter(User.is_demo == True)  # noqa: E712
            .order_by(User.created_at.asc(), User.id.asc()).limit(excess).all()
        )
        _delete_users(db, oldest)

    user = User(
        email=f"demo-{secrets.token_hex(8)}@{DEMO_EMAIL_DOMAIN}",
        # Random password that nobody knows: demo-login is the only way in.
        password_hash=hash_password(secrets.token_urlsafe(32)),
        is_demo=True,
        email_confirmed=True,
        is_verified=True,
        reminder_enabled=False,  # the address is a placeholder; never email it
        created_at=now,
    )
    db.add(user)
    db.flush()
    _seed_subscriptions(db, user, now)
    db.commit()
    db.refresh(user)
    return user


def delete_expired_demo_users(db: Session) -> int:
    """Delete demo accounts older than 24 hours together with their data."""
    cutoff = _now() - DEMO_MAX_AGE
    expired = db.query(User).filter(User.is_demo == True, User.created_at < cutoff).all()  # noqa: E712
    deleted = _delete_users(db, expired)
    db.commit()
    if deleted:
        logger.info(f"Deleted {deleted} expired demo accounts")
    return deleted
