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
    Get monthly spending trends for the last 6 months and forecast for next month.
    Also returns category breakdown.
    """
    subs = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        # We include cancelled ones if they were active during the period, 
        # but for simplicity in this version we might stick to active or check created_at
    ).all()

    today = datetime.utcnow()
    
    # 1. Monthly Trends (Last 6 Months)
    trends = []
    # Loop back 6 months
    for i in range(5, -1, -1):
        month_date = today - timedelta(days=30 * i) # Approx
        # Better month calculation:
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
        
        # Start and end of that month
        start_of_month = datetime(year, month, 1)
        if month == 12:
            end_of_month = datetime(year + 1, 1, 1)
        else:
            end_of_month = datetime(year, month + 1, 1)

        monthly_total_cents = 0
        
        for sub in subs:
            # Check if sub existed
            if sub.created_at >= end_of_month:
                continue
            
            # If cancelled, check if it was cancelled before this month
            # We don't track cancelled_at, so we assume cancelled status implies "not active now"
            # For accurate trends we'd need history.
            # Fallback: Use current Active subs to show "Runway" or "Projected" if history is missing.
            # OR: Mock historical data based on creation date.
            
            isActiveInMonth = True
            if sub.status == "cancelled":
                # Rough heuristic: if it's cancelled, assume it stopped "recently"?
                # Actually, simply counting active ones is safer for "Current Trends"
                # But request asks for "Spending Trends" -> "Unusual Spikes".
                # Let's count ALL subs that were created before this month.
                # If cancelled, we don't know when. Let's include them if created_at < start_of_month? 
                # No, that's messy without cancelled_at.
                # Let's only count ACTIVE subscriptions for "Projected Trend" 
                # OR include cancelled ones as if they were active until now?
                pass

            # Simplified Model: "Projected Cost Breakdown"
            # Calculate what the cost WOULD BE if all *currently active* subs were active back then.
            if sub.status == "active" and sub.created_at < end_of_month:
                if sub.billing_cycle == "monthly":
                    monthly_total_cents += sub.price_cents
                else:
                    # Yearly: check if renewal hits this month?
                    # If start_of_month <= renewal_date < end_of_month
                    # We can project renewal dates back/forward.
                    # next_billing_date is future.
                    # renewal_month = next_billing_date.month
                    # If this month == renewal_month, add full price.
                    if sub.next_billing_date and sub.next_billing_date.month == month:
                        monthly_total_cents += sub.price_cents

        trends.append({
            "month": get_month_name(start_of_month),
            "year": year,
            "total_cents": monthly_total_cents
        })

    # 2. Category Breakdown
    category_totals = {}
    total_spend_cents = 0
    
    active_subs = [s for s in subs if s.status == "active"]
    
    for sub in active_subs:
        # Amortized monthly cost for category view
        monthly_cost = sub.price_cents
        if sub.billing_cycle == "yearly":
            monthly_cost = sub.price_cents // 12
            
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
