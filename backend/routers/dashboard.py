"""
Dashboard summary endpoint — returns all data needed for the dashboard in one request.
Reduces frontend roundtrips from 5-6 to 1.
"""
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import Request
from limiter import limiter

from dependencies import get_db, get_current_user
from models.db import User, Subscription
from routers.analytics import MONTHLY_PLAN_HINT_CENTS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _monthly_cost(sub: Subscription) -> int:
    """Return the user's monthly share in cents for a subscription."""
    split = max(1, sub.split_with or 1)
    if sub.billing_cycle == "monthly":
        return sub.price_cents // split
    # Yearly: amortise as monthly (always amortise for consistency)
    return (sub.price_cents // split) // 12


@router.get("/summary")
@limiter.limit("60/minute")  # Protect heavy 4-SQL endpoint
async def get_dashboard_summary(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Combined dashboard payload — subscriptions + analytics trends + insights + user info.
    Frontend calls this once instead of 5-6 separate endpoints.
    """
    today = datetime.now(timezone.utc).replace(tzinfo=None)
    first_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # ── 1. All subscriptions ──────────────────────────────────────────────────
    all_subs = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
        .all()
    )
    active_subs = [s for s in all_subs if s.status == "active"]

    # ── 2. Analytics: 6-month trends (always amortise yearly) ───────────
    trends = []
    for i in range(5, -1, -1):
        month_offset = first_of_month.month - i
        year = first_of_month.year + (month_offset - 1) // 12
        month = ((month_offset - 1) % 12) + 1
        start_of_month = datetime(year, month, 1)
        end_of_month = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)

        monthly_total = 0
        for sub in all_subs:
            if sub.created_at >= end_of_month:
                continue
            if sub.cancelled_at is not None and sub.cancelled_at < start_of_month:
                continue
            monthly_total += _monthly_cost(sub)

        trends.append({
            "month": start_of_month.strftime("%b"),
            "year": year,
            "total_cents": monthly_total,
        })

    # ── 3. Category breakdown ─────────────────────────────────────────────────
    category_totals: Dict[str, int] = {}
    total_monthly = sum(_monthly_cost(s) for s in active_subs)
    for sub in active_subs:
        cat = sub.category or "Other"
        category_totals[cat] = category_totals.get(cat, 0) + _monthly_cost(sub)

    breakdown = [
        {
            "category": cat,
            "total_cents": cents,
            "percentage": round(cents / total_monthly * 100, 1) if total_monthly > 0 else 0,
        }
        for cat, cents in sorted(category_totals.items(), key=lambda x: -x[1])
    ]

    # ── 4. Insights ───────────────────────────────────────────────────────────
    insights: List[Dict[str, Any]] = []

    # Upcoming renewals in next 7 days
    upcoming_count = 0
    upcoming_cost = 0
    for sub in active_subs:
        if sub.next_billing_date:
            days = (sub.next_billing_date - today).days
            if 0 <= days <= 7:
                upcoming_count += 1
                split = max(1, sub.split_with or 1)
                # Use actual renewal cost (full period price), not monthly amortization
                upcoming_cost += sub.price_cents // split
    if upcoming_count > 0:
        # Use actual renewal price (what the user pays on that date), not monthly amortization
        insights.append({
            "type": "warning",
            "title": "Upcoming Renewals",
            "message": f"You have {upcoming_count} subscription{'s' if upcoming_count > 1 else ''} renewing this week totaling ${upcoming_cost / 100:.2f}.",
            "amount_cents": upcoming_cost,
            "action": "Review",
        })

    # High category spending (>40% on one category)
    for cat, cost in category_totals.items():
        if total_monthly > 0 and (cost / total_monthly) > 0.4:
            insights.append({
                "type": "info",
                "title": f"High {cat} Spending",
                "message": f"You spend {round(cost / total_monthly * 100)}% of your budget on {cat}. Consider bundling services?",
                "action": "Analyze",
            })

    # Monthly plans that cost enough for a yearly plan to be worth checking
    count_switchable = sum(
        1 for sub in active_subs
        if sub.billing_cycle == "monthly" and sub.price_cents >= MONTHLY_PLAN_HINT_CENTS
    )
    if count_switchable > 0:
        insights.append({
            "type": "success",
            "title": "Monthly plans",
            "message": f"{count_switchable} subscription{'s are' if count_switchable > 1 else ' is'} billed monthly. Yearly plans are often cheaper, so check each provider's pricing.",
            "action": "Review"
        })

    # ── 5. User info ──────────────────────────────────────────────────────────
    user_data = {
        "id": current_user.id,
        "email": current_user.email,
        "is_verified": current_user.is_verified,
        "email_confirmed": current_user.email_confirmed,
        "edu_email": current_user.edu_email,
        "is_demo": current_user.is_demo,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }

    # ── 6. Subscription serialisation ────────────────────────────────────────
    def _serialise(sub: Subscription) -> dict:
        return {
            "id": sub.id,
            "name": sub.name,
            "price_cents": sub.price_cents,
            "billing_cycle": sub.billing_cycle,
            "status": sub.status,
            "category": sub.category,
            "created_at": sub.created_at.isoformat() if sub.created_at else None,
            "next_billing_date": sub.next_billing_date.isoformat() if sub.next_billing_date else None,
            "cancelled_at": sub.cancelled_at.isoformat() if sub.cancelled_at else None,
            "reminder_sent": sub.reminder_sent,
            "student_discount_applied": sub.student_discount_applied,
            "split_with": sub.split_with,
        }

    return {
        "user": user_data,
        "subscriptions": [_serialise(s) for s in all_subs],
        "analytics": {
            "trends": trends,
            "breakdown": breakdown,
            "total_monthly_cents": total_monthly,
        },
        "insights": insights,
    }
