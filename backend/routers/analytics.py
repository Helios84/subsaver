from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Dict

from dependencies import get_db, get_current_user
from models.db import User, Subscription

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# Monthly subscriptions at or above this price get a "check the yearly plan" hint.
MONTHLY_PLAN_HINT_CENTS = 1000


def get_month_name(dt: datetime) -> str:
    return dt.strftime("%b")


@router.get("/trends")
def get_spending_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get monthly spending trends for the last 6 months.
    Uses cancelled_at to accurately include subscriptions only during their active period.
    Accounts for split_with to show user's actual share.
    """
    subs = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
    ).all()

    today = datetime.now(timezone.utc).replace(tzinfo=None)
    first_of_this_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # 1. Monthly Trends (Last 6 Months) — accurate with cancelled_at
    trends = []
    for i in range(5, -1, -1):
        month_offset = first_of_this_month.month - i
        year = first_of_this_month.year + (month_offset - 1) // 12
        month = ((month_offset - 1) % 12) + 1

        start_of_month = datetime(year, month, 1)
        end_of_month = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)

        monthly_total_cents = 0

        for sub in subs:
            # Sub must have been created before this month ended
            if sub.created_at >= end_of_month:
                continue

            # Sub must NOT have been cancelled before this month started
            if sub.cancelled_at is not None and sub.cancelled_at < start_of_month:
                continue

            # B-6 fix: divide by split_with to get user's actual share
            split = max(1, sub.split_with or 1)

            # Sub is considered active in this month
            if sub.billing_cycle == "monthly":
                monthly_total_cents += sub.price_cents // split
            else:
                # Yearly: only count if billing date falls in this month
                if sub.next_billing_date and sub.next_billing_date.month == month:
                    monthly_total_cents += sub.price_cents // split
                else:
                    # Amortize yearly cost as monthly
                    monthly_total_cents += (sub.price_cents // split) // 12

        trends.append({
            "month": get_month_name(start_of_month),
            "year": year,
            "total_cents": monthly_total_cents
        })

    # 2. Category Breakdown (current active only) — also accounting for split_with
    active_subs = [s for s in subs if s.status == "active"]
    category_totals: Dict[str, int] = {}
    total_spend_cents = 0

    for sub in active_subs:
        split = max(1, sub.split_with or 1)
        monthly_cost = (sub.price_cents // split) if sub.billing_cycle == "monthly" else (sub.price_cents // split) // 12
        cat = sub.category or "Other"
        category_totals[cat] = category_totals.get(cat, 0) + monthly_cost
        total_spend_cents += monthly_cost

    breakdown = []
    for cat, output_cents in category_totals.items():
        percentage = (output_cents / total_spend_cents * 100) if total_spend_cents > 0 else 0
        breakdown.append({
            "category": cat,
            "total_cents": output_cents,
            "percentage": round(percentage, 1)
        })
    breakdown.sort(key=lambda x: x["total_cents"], reverse=True)

    return {
        "trends": trends,
        "breakdown": breakdown,
        "total_monthly_cents": total_spend_cents
    }


@router.get("/insights")
def get_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate insights and recommendations.
    Amounts are formatted as dollars, not raw cents.
    """
    subs = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == "active"
    ).all()

    insights = []
    today = datetime.now(timezone.utc).replace(tzinfo=None)

    # Insight 1: Upcoming Renewals (next 7 days)
    upcoming_count = 0
    upcoming_cost_cents = 0
    for sub in subs:
        if sub.next_billing_date:
            days = (sub.next_billing_date - today).days
            if 0 <= days <= 7:
                upcoming_count += 1
                split = max(1, sub.split_with or 1)
                upcoming_cost_cents += sub.price_cents // split

    if upcoming_count > 0:
        # Format as dollars, not raw cents
        amount_dollars = upcoming_cost_cents / 100
        insights.append({
            "type": "warning",
            "title": "Upcoming Renewals",
            "message": f"You have {upcoming_count} subscription{'s' if upcoming_count > 1 else ''} renewing this week totaling ${amount_dollars:.2f}.",
            "amount_cents": upcoming_cost_cents,
            "action": "Review"
        })

    # Insight 2: Category Domination
    category_costs = {}
    total_cost = 0

    for sub in subs:
        cat = sub.category or "Other"
        split = max(1, sub.split_with or 1)
        monthly_cost = (sub.price_cents // split) if sub.billing_cycle == "monthly" else (sub.price_cents // split) // 12
        category_costs[cat] = category_costs.get(cat, 0) + monthly_cost
        total_cost += monthly_cost

    for cat, cost in category_costs.items():
        if total_cost > 0 and (cost / total_cost) > 0.4:
            insights.append({
                "type": "info",
                "title": f"High {cat} Spending",
                "message": f"You spend {round(cost/total_cost*100)}% of your budget on {cat}. Consider bundling services?",
                "action": "Analyze"
            })

    # Insight 3: monthly plans that cost enough for a yearly plan to be worth checking
    count_switchable = sum(
        1 for sub in subs
        if sub.billing_cycle == "monthly" and sub.price_cents >= MONTHLY_PLAN_HINT_CENTS
    )

    if count_switchable > 0:
        insights.append({
            "type": "success",
            "title": "Monthly plans",
            "message": f"{count_switchable} subscription{'s are' if count_switchable > 1 else ' is'} billed monthly. Yearly plans are often cheaper, so check each provider's pricing.",
            "action": "Review"
        })

    return insights
