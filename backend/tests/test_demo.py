"""Temporary demo accounts: creation, isolation, restrictions, cleanup and limits."""
from datetime import datetime, timedelta, timezone

from config import settings
from conftest import ip_header
from models.db import Subscription, User
from services.demo_service import delete_expired_demo_users


def demo_headers(client, ip: int = 50) -> dict:
    r = client.post("/auth/demo-login", headers=ip_header(ip))
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_demo_login_is_off_when_disabled(client, monkeypatch):
    monkeypatch.setattr(settings, "demo_enabled", False)
    assert client.post("/auth/demo-login").status_code == 404


def test_each_demo_login_gets_its_own_account_with_sample_data(client):
    a, b = demo_headers(client, 50), demo_headers(client, 51)
    me_a, me_b = client.get("/users/me", headers=a).json(), client.get("/users/me", headers=b).json()
    assert me_a["id"] != me_b["id"] and me_a["is_demo"] and me_b["is_demo"]

    subs = client.get("/subscriptions", headers=a).json()
    assert len(subs) == 10
    assert sum(s["status"] == "cancelled" for s in subs) == 1
    assert sum(s["student_discount_applied"] for s in subs) == 1
    assert any(s["split_with"] > 1 for s in subs)

    client.delete(f"/subscriptions/{subs[0]['id']}", headers=a)
    assert len(client.get("/subscriptions", headers=a).json()) == 9
    assert len(client.get("/subscriptions", headers=b).json()) == 10


def test_demo_accounts_cannot_change_account_settings(client):
    h = demo_headers(client)
    email = client.get("/users/me", headers=h).json()["email"]
    assert client.request("DELETE", "/users/me", headers=h, json={"password": "x"}).status_code == 403
    assert client.post("/auth/verify-edu", headers=h, json={"edu_email": "a@example.edu"}).status_code == 403
    assert client.put("/reminders/settings", headers=h, json={"reminder_enabled": True}).status_code == 403
    assert client.post("/auth/forgot-password", json={"email": email}).status_code == 403
    assert client.post("/auth/reset-password", json={"email": email, "code": "123456", "new_password": "something-new"}).status_code == 403
    # ordinary editing still works
    assert client.put("/reminders/settings", headers=h, json={"reminder_days_before": 3}).status_code == 200


def test_cleanup_removes_only_demo_accounts_older_than_a_day(client, db):
    demo_headers(client, 50)
    demo_headers(client, 51)
    old, young = db.query(User).filter_by(is_demo=True).order_by(User.id).all()
    old.created_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=25)
    db.add(User(email="real@example.com", password_hash="x", email_confirmed=True,
                created_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=90)))
    db.commit()
    old_id = old.id

    assert delete_expired_demo_users(db) == 1
    db.expire_all()
    assert db.get(User, old_id) is None
    assert db.query(Subscription).filter_by(user_id=old_id).count() == 0
    assert db.get(User, young.id) is not None
    assert db.query(User).filter_by(email="real@example.com").count() == 1


def test_number_of_live_demo_accounts_is_capped(client, db, monkeypatch):
    monkeypatch.setattr(settings, "demo_max_users", 3)
    for ip in range(60, 65):
        demo_headers(client, ip)
    assert db.query(User).filter_by(is_demo=True).count() == 3


def test_demo_login_is_rate_limited_per_client(client):
    codes = [client.post("/auth/demo-login", headers=ip_header(70)).status_code for _ in range(11)]
    assert codes == [200] * 10 + [429]
    assert client.post("/auth/demo-login", headers=ip_header(71)).status_code == 200
