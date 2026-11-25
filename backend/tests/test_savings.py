"""Student prices (apply / remove) and savings: unit tests for the calculations and API tests."""
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from dateutil.relativedelta import relativedelta

from conftest import add_discount, add_sub, signup
from models.db import Subscription
from services.savings import find_discount, full_months_between, monthly_share_cents, savings_summary


def now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ── calculations ──────────────────────────────────────────────────────────────

def test_monthly_share_splits_and_spreads_yearly_prices():
    assert monthly_share_cents(1299, "monthly", 1) == 1299
    assert monthly_share_cents(1800, "monthly", 3) == 600
    assert monthly_share_cents(1000, "monthly", 3) == 333          # integer cents, rounded down
    assert monthly_share_cents(5999, "yearly", 1) == 499
    assert monthly_share_cents(5999, "yearly", None) == 499


def test_full_months_between():
    start = datetime(2026, 1, 15)
    assert full_months_between(start, datetime(2026, 2, 14)) == 0
    assert full_months_between(start, datetime(2026, 2, 15)) == 1
    assert full_months_between(start, datetime(2027, 1, 20)) == 12
    assert full_months_between(start, datetime(2025, 12, 1)) == 0


def test_find_discount_matching_rules():
    catalog = [SimpleNamespace(service_name=n) for n in ("Spotify", "YouTube Premium", "Hulu")]
    assert find_discount("spotify", catalog).service_name == "Spotify"            # exact, any case
    assert find_discount("Spotify Premium", catalog).service_name == "Spotify"    # catalog name inside
    assert find_discount("YouTube", catalog).service_name == "YouTube Premium"    # long enough to be inside
    assert find_discount("Hu", catalog) is None                                   # too short to guess
    assert find_discount("Campus Gym", catalog) is None


def test_realized_savings_from_a_cancellation():
    t = datetime(2026, 11, 25)
    sub = SimpleNamespace(id=1, name="Hulu", status="cancelled", price_cents=1199, billing_cycle="monthly",
                          split_with=1, cancelled_at=t - relativedelta(months=3) - timedelta(days=2),
                          student_discount_applied=False)
    summary = savings_summary([sub], [], now=t)
    assert summary["cancelled_saved_to_date"] == 1199 * 3
    assert summary["total_saved_to_date"] == 1199 * 3
    assert summary["potential_monthly"] == 0


# ── API ───────────────────────────────────────────────────────────────────────

def test_batch_check_offers_savings_from_the_users_own_share(client):
    add_discount("Spotify", 1299, 699)
    add_discount("Netflix", 1549, 799)
    headers = signup(client)
    spotify = add_sub(client, headers, name="Spotify Premium", price_cents=1399)
    netflix = add_sub(client, headers, name="Netflix", price_cents=1549, split_with=3)
    yearly = add_sub(client, headers, name="Spotify", price_cents=9999, billing_cycle="yearly")
    cheaper = add_sub(client, headers, name="Spotify", price_cents=599)
    ids = [spotify["id"], netflix["id"], yearly["id"], cheaper["id"]]

    result = client.post("/api/student-discounts/batch-check", headers=headers, json={"subscription_ids": ids}).json()
    assert result[str(spotify["id"])]["your_monthly_savings_cents"] == 1399 - 699
    assert result[str(netflix["id"])]["your_monthly_savings_cents"] == 1549 // 3 - 799 // 3
    assert result[str(yearly["id"])] is None      # catalog prices are monthly
    assert result[str(cheaper["id"])] is None     # already pays less than the student price


def test_apply_stores_the_old_price_and_remove_restores_it(client):
    add_discount("Spotify", 1299, 699)
    headers = signup(client)
    sub = add_sub(client, headers, name="Spotify", price_cents=1299)

    r = client.post(f"/api/student-discounts/apply/{sub['id']}", headers=headers)
    assert r.status_code == 200 and r.json()["savings_per_month_cents"] == 600
    applied = client.get("/subscriptions", headers=headers).json()[0]
    assert applied["price_cents"] == 699 and applied["original_price_cents"] == 1299

    assert client.delete(f"/api/student-discounts/unapply/{sub['id']}", headers=headers).status_code == 200
    restored = client.get("/subscriptions", headers=headers).json()[0]
    assert restored["price_cents"] == 1299
    assert restored["original_price_cents"] is None and restored["student_discount_applied"] is False


def test_apply_refuses_cases_it_cannot_handle(client):
    add_discount("Spotify", 1299, 699)
    headers = signup(client)
    yearly = add_sub(client, headers, name="Spotify", price_cents=9999, billing_cycle="yearly")
    cheaper = add_sub(client, headers, name="Spotify", price_cents=499)
    unknown = add_sub(client, headers, name="Campus Gym", price_cents=2500)
    normal = add_sub(client, headers, name="Spotify", price_cents=1299)

    assert client.post(f"/api/student-discounts/apply/{yearly['id']}", headers=headers).status_code == 400
    assert client.post(f"/api/student-discounts/apply/{cheaper['id']}", headers=headers).status_code == 400
    assert client.post(f"/api/student-discounts/apply/{unknown['id']}", headers=headers).status_code == 404
    assert client.post(f"/api/student-discounts/apply/{normal['id']}", headers=headers).status_code == 200
    assert client.post(f"/api/student-discounts/apply/{normal['id']}", headers=headers).status_code == 400
    assert client.delete(f"/api/student-discounts/unapply/{unknown['id']}", headers=headers).status_code == 400


def test_other_users_cannot_apply_a_student_price_to_my_subscription(client):
    add_discount("Spotify", 1299, 699)
    alice = signup(client, "alice@example.com", ip=1)
    bob = signup(client, "bob@example.com", ip=2)
    sub = add_sub(client, alice, name="Spotify", price_cents=1299)
    assert client.post(f"/api/student-discounts/apply/{sub['id']}", headers=bob).status_code == 404


def test_cancelled_subscriptions_are_not_potential_savings(client):
    add_discount("Spotify", 1299, 699)
    headers = signup(client)
    sub = add_sub(client, headers, name="Spotify", price_cents=1299)
    assert client.get("/api/student-discounts/savings", headers=headers).json()["potential_monthly"] == 600
    client.patch(f"/subscriptions/{sub['id']}", headers=headers, json={"status": "cancelled"})
    assert client.get("/api/student-discounts/savings", headers=headers).json()["potential_monthly"] == 0


def test_saved_so_far_adds_student_prices_and_cancellations(client, db):
    add_discount("Spotify", 1299, 699)
    headers = signup(client)
    spotify = add_sub(client, headers, name="Spotify", price_cents=1299)
    hulu = add_sub(client, headers, name="Hulu", price_cents=1199)
    client.post(f"/api/student-discounts/apply/{spotify['id']}", headers=headers)
    client.patch(f"/subscriptions/{hulu['id']}", headers=headers, json={"status": "cancelled"})

    db.get(Subscription, spotify["id"]).discount_applied_date = now() - relativedelta(months=2) - timedelta(days=1)
    db.get(Subscription, hulu["id"]).cancelled_at = now() - relativedelta(months=3) - timedelta(days=1)
    db.commit()

    s = client.get("/api/student-discounts/savings", headers=headers).json()
    assert s["student_saved_to_date"] == 600 * 2
    assert s["cancelled_saved_to_date"] == 1199 * 3
    assert s["total_saved_to_date"] == 600 * 2 + 1199 * 3
    assert s["total_saved_monthly"] == 600
