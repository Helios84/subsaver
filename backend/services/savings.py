"""Savings calculations shared by the dashboard summary and the student-discount endpoints.

All amounts are integer cents and are the user's own share (price divided by
the number of people splitting it). Catalog prices are monthly prices.
"""
from datetime import datetime, timezone
from typing import Iterable, Optional

from dateutil.relativedelta import relativedelta

from models.db import Subscription
from models.student_discount import StudentDiscount


def share_cents(price_cents: int, split_with: Optional[int]) -> int:
    """The user's share of one charge."""
    return price_cents // max(1, split_with or 1)


def monthly_share_cents(price_cents: int, billing_cycle: str, split_with: Optional[int]) -> int:
    """The user's share per month; a yearly price is spread over 12 months."""
    share = share_cents(price_cents, split_with)
    return share // 12 if billing_cycle == "yearly" else share


def full_months_between(start: datetime, end: datetime) -> int:
    """Whole calendar months from start to end (0 if end is before start)."""
    if end <= start:
        return 0
    delta = relativedelta(end, start)
    return delta.years * 12 + delta.months


def find_discount(name: str, discounts: Iterable[StudentDiscount]) -> Optional[StudentDiscount]:
    """Match a subscription name to a catalog entry.

    An exact (case-insensitive) match wins. Otherwise a catalog name contained in
    the subscription name matches ("Spotify Premium" -> "Spotify"), and so does a
    subscription name of at least four characters contained in a catalog name.
    """
    wanted = name.strip().lower()
    if not wanted:
        return None
    discounts = list(discounts)
    for d in discounts:
        if d.service_name.lower() == wanted:
            return d
    for d in discounts:
        if d.service_name.lower() in wanted:
            return d
    if len(wanted) >= 4:
        for d in discounts:
            if wanted in d.service_name.lower():
                return d
    return None


def available_saving_cents(sub: Subscription, discount: StudentDiscount) -> int:
    """Monthly saving (user's share) if this subscription moved to the student price.

    Only monthly subscriptions that currently cost more than the student price
    qualify: the catalog has no yearly student prices to compare against.
    """
    if sub.status != "active" or sub.student_discount_applied or sub.billing_cycle != "monthly":
        return 0
    if discount.student_price_cents >= sub.price_cents:
        return 0
    return share_cents(sub.price_cents, sub.split_with) - share_cents(discount.student_price_cents, sub.split_with)


def applied_saving_cents(sub: Subscription) -> int:
    """Monthly saving (user's share) from a student price that was applied to this subscription."""
    if not sub.student_discount_applied or sub.original_price_cents is None:
        return 0
    before = monthly_share_cents(sub.original_price_cents, sub.billing_cycle, sub.split_with)
    after = monthly_share_cents(sub.price_cents, sub.billing_cycle, sub.split_with)
    return max(0, before - after)


def savings_summary(subs: Iterable[Subscription], discounts: Iterable[StudentDiscount], now: Optional[datetime] = None) -> dict:
    """Everything the UI shows about savings, computed from the user's own prices."""
    now = now or datetime.now(timezone.utc).replace(tzinfo=None)
    discounts = list(discounts)

    student_monthly = 0          # current monthly saving from applied student prices
    student_to_date = 0          # saved so far by those student prices
    potential_monthly = 0        # what the remaining catalog matches would save
    cancelled_to_date = 0        # not spent since cancelling
    applied_count = available_count = cancelled_count = 0
    breakdown = []

    for sub in subs:
        if sub.status == "cancelled":
            if sub.cancelled_at is not None:
                monthly = monthly_share_cents(sub.price_cents, sub.billing_cycle, sub.split_with)
                months = full_months_between(sub.cancelled_at, now)
                cancelled_to_date += monthly * months
                cancelled_count += 1
                breakdown.append({
                    "service": sub.name, "subscription_id": sub.id, "status": "cancelled",
                    "monthly_savings": monthly, "months": months, "saved_to_date": monthly * months,
                })
            continue
        if sub.status != "active":
            continue

        if sub.student_discount_applied:
            monthly = applied_saving_cents(sub)
            months = full_months_between(sub.discount_applied_date, now) if sub.discount_applied_date else 0
            student_monthly += monthly
            student_to_date += monthly * months
            applied_count += 1
            breakdown.append({
                "service": sub.name, "subscription_id": sub.id, "status": "applied",
                "monthly_savings": monthly, "months": months, "saved_to_date": monthly * months,
            })
            continue

        discount = find_discount(sub.name, discounts)
        if discount is not None:
            saving = available_saving_cents(sub, discount)
            if saving > 0:
                potential_monthly += saving
                available_count += 1
                breakdown.append({
                    "service": sub.name, "subscription_id": sub.id, "status": "available",
                    "monthly_savings": saving, "months": 0, "saved_to_date": 0,
                })

    return {
        # student prices
        "total_saved_monthly": student_monthly,
        "total_saved_yearly": student_monthly * 12,
        "potential_monthly": potential_monthly,
        "potential_yearly": potential_monthly * 12,
        "discounts_applied": applied_count,
        "discounts_available": available_count,
        # realized savings to date
        "student_saved_to_date": student_to_date,
        "cancelled_saved_to_date": cancelled_to_date,
        "cancelled_count": cancelled_count,
        "total_saved_to_date": student_to_date + cancelled_to_date,
        "breakdown": breakdown,
    }
