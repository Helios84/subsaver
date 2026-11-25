"""Dashboard summary: monthly totals, trends over time, insights."""
from datetime import datetime, timedelta, timezone

from dateutil.relativedelta import relativedelta

from conftest import add_sub, signup
from models.db import Subscription


def now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def test_monthly_total_uses_the_users_share_and_spreads_yearly_plans(client):
    headers = signup(client)
    add_sub(client, headers, name="Spotify", price_cents=1299)                       # 1299
    add_sub(client, headers, name="Netflix", price_cents=1800, split_with=3)         # 600
    add_sub(client, headers, name="Duolingo", price_cents=5999, billing_cycle="yearly")  # 5999 // 12 = 499
    summary = client.get("/api/dashboard/summary", headers=headers).json()
    assert summary["analytics"]["total_monthly_cents"] == 1299 + 600 + 499


def test_cancelled_subscriptions_leave_the_monthly_total(client):
    headers = signup(client)
    keep = add_sub(client, headers, name="Spotify", price_cents=1299)
    drop = add_sub(client, headers, name="Hulu", price_cents=1199)
    client.patch(f"/subscriptions/{drop['id']}", headers=headers, json={"status": "cancelled"})
    summary = client.get("/api/dashboard/summary", headers=headers).json()
    assert summary["analytics"]["total_monthly_cents"] == keep["price_cents"]


def test_trends_count_a_subscription_only_while_it_was_active(client, db):
    headers = signup(client)
    sub = add_sub(client, headers, name="Hulu", price_cents=1000)
    row = db.get(Subscription, sub["id"])
    row.created_at = now() - relativedelta(months=3)
    row.status = "cancelled"
    row.cancelled_at = now() - relativedelta(months=2)
    db.commit()

    trends = [m["total_cents"] for m in client.get("/api/dashboard/summary", headers=headers).json()["analytics"]["trends"]]
    # six months, oldest first: added three months ago, cancelled two months ago
    assert trends == [0, 0, 1000, 1000, 0, 0]


def test_upcoming_renewals_insight_uses_the_users_share(client):
    headers = signup(client)
    soon = (now() + timedelta(days=3)).isoformat()
    add_sub(client, headers, name="Netflix", price_cents=1800, split_with=2, next_billing_date=soon)
    insights = client.get("/api/dashboard/summary", headers=headers).json()["insights"]
    renewals = next(i for i in insights if i["title"] == "Upcoming Renewals")
    assert renewals["amount_cents"] == 900


def test_monthly_plans_insight_counts_monthly_subscriptions_over_ten_dollars(client):
    headers = signup(client)
    add_sub(client, headers, name="A", price_cents=1500)
    add_sub(client, headers, name="B", price_cents=999)                          # below the threshold
    add_sub(client, headers, name="C", price_cents=5000, billing_cycle="yearly")  # already yearly
    insights = client.get("/api/dashboard/summary", headers=headers).json()["insights"]
    hint = next(i for i in insights if i["title"] == "Monthly plans")
    assert hint["message"].startswith("1 subscription is billed monthly")


def test_summary_savings_match_the_savings_endpoint(client):
    headers = signup(client)
    add_sub(client, headers)
    summary = client.get("/api/dashboard/summary", headers=headers).json()["savings"]
    direct = client.get("/api/student-discounts/savings", headers=headers).json()
    assert summary == direct
