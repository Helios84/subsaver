"""API endpoints for reminder management."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from dependencies import get_current_user, get_db
from models.db import Subscription


router = APIRouter(prefix="/reminders", tags=["reminders"])


# --- Pydantic Models ---
class ReminderSettingsUpdate(BaseModel):
    reminder_enabled: Optional[bool] = None
    reminder_days_before: Optional[int] = None


class ReminderSettingsResponse(BaseModel):
    reminder_enabled: bool
    reminder_days_before: int


class UpcomingRenewalResponse(BaseModel):
    id: int
    name: str
    price_cents: int
    billing_cycle: str
    next_billing_date: Optional[datetime]
    days_until_renewal: Optional[int]
    reminder_sent: bool
    
    class Config:
        from_attributes = True


# --- Endpoints ---
@router.get("/settings", response_model=ReminderSettingsResponse)
def get_reminder_settings(current_user=Depends(get_current_user)):
    """Get user's reminder settings."""
    return {
        "reminder_enabled": current_user.reminder_enabled,
        "reminder_days_before": current_user.reminder_days_before
    }


@router.put("/settings", response_model=ReminderSettingsResponse)
def update_reminder_settings(
    settings: ReminderSettingsUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's reminder settings."""
    if settings.reminder_enabled is not None:
        current_user.reminder_enabled = settings.reminder_enabled
    
    if settings.reminder_days_before is not None:
        if settings.reminder_days_before not in [3, 7, 14]:
            raise HTTPException(
                status_code=400,
                detail="reminder_days_before must be 3, 7, or 14"
            )
        current_user.reminder_days_before = settings.reminder_days_before
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "reminder_enabled": current_user.reminder_enabled,
        "reminder_days_before": current_user.reminder_days_before
    }


@router.get("/upcoming", response_model=List[UpcomingRenewalResponse])
def get_upcoming_renewals(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get subscriptions with upcoming renewals."""
    
    subscriptions = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status == "active",
            Subscription.next_billing_date.isnot(None)
        )
        .all()
    )
    
    result = []
    now = datetime.utcnow()
    
    for sub in subscriptions:
        days_until = (sub.next_billing_date - now).days if sub.next_billing_date else None
        result.append({
            "id": sub.id,
            "name": sub.name,
            "price_cents": sub.price_cents,
            "billing_cycle": sub.billing_cycle,
            "next_billing_date": sub.next_billing_date,
            "days_until_renewal": days_until,
            "reminder_sent": sub.reminder_sent
        })
    
    # Sort by days until renewal (soonest first)
    result.sort(key=lambda x: x["days_until_renewal"] if x["days_until_renewal"] is not None else 999)
    
    return result


@router.post("/send-now")
def send_reminders_now(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually trigger reminder check for current user only (not all users)."""
    from services.reminder_service import reminder_service
    
    # M-8 fix: only send reminders for the requesting user, not all users
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    active_subs = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status == "active",
            Subscription.next_billing_date.isnot(None),
            Subscription.reminder_sent == False,
        )
        .all()
    )
    
    sent_count = 0
    failed_count = 0
    from services.email_service import email_service
    
    for sub in active_subs:
        days_until = (sub.next_billing_date - now).days
        if 0 <= days_until <= current_user.reminder_days_before:
            success = email_service.send_reminder_email(
                to_email=current_user.email,
                subscription_name=sub.name,
                price_cents=sub.price_cents,
                billing_cycle=sub.billing_cycle,
                next_billing_date=sub.next_billing_date,
                days_until_renewal=days_until
            )
            if success:
                sub.reminder_sent = True
                sub.last_reminder_date = datetime.now(timezone.utc).replace(tzinfo=None)
                sent_count += 1
            else:
                failed_count += 1
    
    db.commit()
    return {
        "message": "Reminder check completed for your account",
        "sent": sent_count,
        "failed": failed_count,
        "total": sent_count + failed_count
    }


@router.post("/test-email")
def send_test_email(current_user=Depends(get_current_user)):
    """Send a test reminder email to the current user. Rate limited: 3/hour."""
    from services.email_service import email_service
    from limiter import limiter
    from fastapi import Request
    
    # Send test email
    success = email_service.send_reminder_email(
        to_email=current_user.email,
        subscription_name="Netflix (Test)",
        price_cents=1599,
        billing_cycle="monthly",
        next_billing_date=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7),
        days_until_renewal=7
    )
    
    if success:
        return {"message": f"Test email sent to {current_user.email}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send test email")
