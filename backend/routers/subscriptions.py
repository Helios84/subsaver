"""Subscription CRUD router — /subscriptions endpoints."""
import logging
from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db, get_current_user
from models.db import User, Subscription
from schemas.subscription import SubscriptionCreate, SubscriptionUpdate, SubscriptionOut, BILLING_CYCLES, STATUSES, CATEGORIES

logger = logging.getLogger(__name__)

router = APIRouter(tags=["subscriptions"])


@router.get("/subscriptions", response_model=List[SubscriptionOut])
def list_subscriptions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
        .all()
    )


@router.post("/subscriptions", response_model=SubscriptionOut)
def create_subscription(
    payload: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import traceback
    try:
        from services.reminder_service import reminder_service
        next_billing_date = payload.next_billing_date
        if not next_billing_date and payload.status == "active":
            next_billing_date = reminder_service.calculate_next_billing_date(
                datetime.utcnow(), payload.billing_cycle
            )
        sub = Subscription(
            user_id=current_user.id,
            name=payload.name,
            price_cents=payload.price_cents,
            billing_cycle=payload.billing_cycle,
            status=payload.status,
            category=payload.category,
            next_billing_date=next_billing_date,
            split_with=payload.split_with,
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
        return sub
    except Exception:
        traceback.print_exc()
        raise


@router.patch("/subscriptions/{sub_id}", response_model=SubscriptionOut)
def update_subscription(
    sub_id: int,
    payload: SubscriptionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = db.query(Subscription).filter(
        Subscription.id == sub_id, Subscription.user_id == current_user.id
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if payload.price_cents is not None and payload.price_cents < 0:
        raise HTTPException(status_code=400, detail="price_cents must be >= 0")
    if payload.split_with is not None and payload.split_with < 1:
        raise HTTPException(status_code=400, detail="split_with must be >= 1")
    if payload.billing_cycle is not None and payload.billing_cycle not in BILLING_CYCLES:
        raise HTTPException(status_code=400, detail=f"billing_cycle must be one of {BILLING_CYCLES}")
    if payload.status is not None and payload.status not in STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {STATUSES}")

    if payload.name is not None:         sub.name = payload.name.strip()
    if payload.price_cents is not None:  sub.price_cents = payload.price_cents
    if payload.billing_cycle is not None: sub.billing_cycle = payload.billing_cycle
    if payload.status is not None:       sub.status = payload.status
    if payload.category is not None:     sub.category = payload.category if payload.category in CATEGORIES else "Other"
    if payload.next_billing_date is not None: sub.next_billing_date = payload.next_billing_date
    if payload.split_with is not None:   sub.split_with = payload.split_with

    db.commit()
    db.refresh(sub)
    return sub




@router.delete("/subscriptions/{sub_id}")
def delete_subscription(
    sub_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = db.query(Subscription).filter(
        Subscription.id == sub_id, Subscription.user_id == current_user.id
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    db.delete(sub)
    db.commit()
    return {"message": "deleted"}
