"""Student discount catalog: lookup, apply/remove a student price, savings summary."""
import logging
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from dependencies import get_db, get_current_user
from limiter import limiter
from models.db import User, Subscription
from models.student_discount import StudentDiscount
from services.savings import available_saving_cents, find_discount, savings_summary

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/student-discounts", tags=["student-discounts"])


class BatchCheckRequest(BaseModel):
    subscription_ids: List[int] = Field(..., max_length=500)


def _active_discounts(db: Session) -> List[StudentDiscount]:
    return db.query(StudentDiscount).filter(StudentDiscount.is_active == True).all()  # noqa: E712


def _own_subscription(db: Session, user: User, subscription_id: int) -> Subscription:
    sub = db.query(Subscription).filter(
        Subscription.id == subscription_id, Subscription.user_id == user.id
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return sub


@router.post("/batch-check")
@limiter.limit("30/minute")
def batch_check_discounts(
    request: Request,
    payload: BatchCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Match several of the user's subscriptions against the catalog in one request.

    Returns a dict of subscription id (as a string) to the catalog entry, or null.
    An entry is returned when the student price is already applied, or when it
    would lower what the user pays.
    """
    subs = db.query(Subscription).filter(
        Subscription.id.in_(payload.subscription_ids),
        Subscription.user_id == current_user.id,
    ).all()
    sub_map = {s.id: s for s in subs}
    discounts = _active_discounts(db)

    result: dict = {}
    for sub_id in payload.subscription_ids:
        result[str(sub_id)] = None
        sub = sub_map.get(sub_id)
        if not sub:
            continue
        discount = find_discount(sub.name, discounts)
        if discount is None:
            continue
        saving = available_saving_cents(sub, discount)
        if not sub.student_discount_applied and saving <= 0:
            continue
        entry = discount.to_dict()
        entry["subscription_id"] = sub_id
        entry["already_applied"] = sub.student_discount_applied
        entry["your_monthly_savings_cents"] = saving
        result[str(sub_id)] = entry
    return result


@router.get("")
@limiter.limit("30/minute")
def get_all_student_discounts(request: Request, db: Session = Depends(get_db)):
    """The whole catalog. Public: no authentication required."""
    return [d.to_dict() for d in _active_discounts(db)]


@router.post("/apply/{subscription_id}")
def apply_student_price(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Switch a subscription to the catalog's student price, remembering the old price."""
    sub = _own_subscription(db, current_user, subscription_id)
    if sub.student_discount_applied:
        raise HTTPException(status_code=400, detail="A student price is already applied")
    if sub.billing_cycle != "monthly":
        raise HTTPException(status_code=400, detail="Student prices in the catalog are monthly prices")

    discount = find_discount(sub.name, _active_discounts(db))
    if discount is None:
        raise HTTPException(status_code=404, detail="No student price found for this service")
    if discount.student_price_cents >= sub.price_cents:
        raise HTTPException(status_code=400, detail="You already pay the student price or less")

    saving = available_saving_cents(sub, discount)
    sub.original_price_cents = sub.price_cents
    sub.price_cents = discount.student_price_cents
    sub.student_discount_applied = True
    sub.discount_applied_date = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(sub)

    return {
        "message": "Student price applied",
        "subscription_id": sub.id,
        "price_cents": sub.price_cents,
        "original_price_cents": sub.original_price_cents,
        "savings_per_month_cents": saving,
        "savings_per_year_cents": saving * 12,
    }


@router.delete("/unapply/{subscription_id}")
def remove_student_price(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Undo apply: restore the price the subscription had before the student price."""
    sub = _own_subscription(db, current_user, subscription_id)
    if not sub.student_discount_applied:
        raise HTTPException(status_code=400, detail="No student price is applied")

    if sub.original_price_cents is not None:
        sub.price_cents = sub.original_price_cents
    sub.original_price_cents = None
    sub.student_discount_applied = False
    sub.discount_applied_date = None
    db.commit()
    db.refresh(sub)
    return {"message": "Student price removed", "subscription_id": sub.id, "price_cents": sub.price_cents}


@router.get("/savings")
def get_savings_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Savings from student prices and from cancelled subscriptions, based on the user's own prices."""
    subs = db.query(Subscription).filter(Subscription.user_id == current_user.id).all()
    return savings_summary(subs, _active_discounts(db))
