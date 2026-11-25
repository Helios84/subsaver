"""API endpoints for reminder management."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from dependencies import get_current_user, get_db


router = APIRouter(prefix="/reminders", tags=["reminders"])


# --- Pydantic Models ---
class ReminderSettingsUpdate(BaseModel):
    reminder_enabled: Optional[bool] = None
    reminder_days_before: Optional[int] = None


class ReminderSettingsResponse(BaseModel):
    reminder_enabled: bool
    reminder_days_before: int


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
    # Demo addresses are placeholders, so reminder emails stay off for them.
    if current_user.is_demo and settings.reminder_enabled:
        raise HTTPException(status_code=403, detail="Email reminders are not available for demo accounts")
    if settings.reminder_enabled is not None:
        current_user.reminder_enabled = settings.reminder_enabled
    
    if settings.reminder_days_before is not None:
        if not (1 <= settings.reminder_days_before <= 30):
            raise HTTPException(
                status_code=400,
                detail="reminder_days_before must be between 1 and 30"
            )
        current_user.reminder_days_before = settings.reminder_days_before
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "reminder_enabled": current_user.reminder_enabled,
        "reminder_days_before": current_user.reminder_days_before
    }
