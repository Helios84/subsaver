from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import calendar
from typing import List, Dict, Any

from dependencies import get_db, get_current_user
from models.db import User, Subscription

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

def get_month_name(dt: datetime) -> str:
    return dt.strftime("%b")

@router.get("/trends")
async def get_spending_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get monthly spending trends for the last 6 months.
    Uses cancelled_at to accurately include subscriptions only during their active period.
    """
    subs = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
    ).all()

    today = datetime.utcnow()
    first_of_this_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # 1. Monthly Trends (Last 6 Months) — accurate with cancelled_at
    trends = []
    for i in range(5, -1, -1):
        # Correctly subtract months by working from first-of-month and going back
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

            # Sub is considered active in this month
            if sub.billing_cycle == "monthly":
                monthly_total_cents += sub.price_cents
            else:
                # Yearly: only count if billing date falls in this month
                if sub.next_billing_date and sub.next_billing_date.month == month:
                    monthly_total_cents += sub.price_cents
                else:
                    # Amortize yearly cost as monthly
                    monthly_total_cents += sub.price_cents // 12

        trends.append({
            "month": get_month_name(start_of_month),
            "year": year,
            "total_cents": monthly_total_cents
        })

    # 2. Category Breakdown (current active only)
    active_subs = [s for s in subs if s.status == "active"]
    category_totals: Dict[str, int] = {}
    total_spend_cents = 0

    for sub in active_subs:
        monthly_cost = sub.price_cents if sub.billing_cycle == "monthly" else sub.price_cents // 12
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
async def get_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate insights and recommendations.
    """
    subs = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == "active"
    ).all()

    insights = []
    today = datetime.utcnow()

    # Insight 1: Upcoming Renewals (next 7 days)
    upcoming_count = 0
    upcoming_cost_cents = 0
    for sub in subs:
        if sub.next_billing_date:
            days = (sub.next_billing_date - today).days
            if 0 <= days <= 7:
                upcoming_count += 1
                upcoming_cost_cents += sub.price_cents

    if upcoming_count > 0:
        insights.append({
            "type": "warning",
            "title": "Upcoming Renewals",
            "message": f"You have {upcoming_count} subscriptions renewing this week totaling ${(upcoming_cost_cents/100):.2f}.",
            "action": "Review"
        })

    # Insight 2: Category Domination
    category_counts = {}
    category_costs = {}
    total_cost = 0

    for sub in subs:
        cat = sub.category or "Other"
        monthly_cost = sub.price_cents if sub.billing_cycle == "monthly" else sub.price_cents // 12
        
        category_counts[cat] = category_counts.get(cat, 0) + 1
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

    # Insight 3: Switch to Yearly
    potential_yearly_savings = 0
    count_switchable = 0
    
    for sub in subs:
        if sub.billing_cycle == "monthly":
            # Heuristic: 20% saving on yearly
            saving = sub.price_cents * 12 * 0.20
            if saving > 2000: # Save more than $20
                potential_yearly_savings += saving
                count_switchable += 1

    if potential_yearly_savings > 0:
        insights.append({
            "type": "success",
            "title": "Annual Plan Savings",
            "message": f"Switching {count_switchable} services to annual plans could save you ~${(potential_yearly_savings/100):.0f}/year.",
            "action": "View Options"
        })

    return insights
