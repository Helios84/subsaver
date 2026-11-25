"""Subscription CRUD, validation, cancellation and isolation between users."""
from conftest import add_sub, signup


def test_create_list_update_delete(client):
    headers = signup(client)
    sub = add_sub(client, headers, name="Netflix", price_cents=1549, category="Entertainment")
    assert [s["name"] for s in client.get("/subscriptions", headers=headers).json()] == ["Netflix"]

    r = client.patch(f"/subscriptions/{sub['id']}", headers=headers, json={"price_cents": 1799, "split_with": 2})
    assert r.status_code == 200
    assert r.json()["price_cents"] == 1799 and r.json()["split_with"] == 2

    assert client.delete(f"/subscriptions/{sub['id']}", headers=headers).status_code == 200
    assert client.get("/subscriptions", headers=headers).json() == []


def test_invalid_input_is_rejected(client):
    headers = signup(client)
    assert client.post("/subscriptions", headers=headers, json={"name": "X", "price_cents": -1}).status_code == 422
    assert client.post("/subscriptions", headers=headers, json={"name": "  ", "price_cents": 100}).status_code == 422
    assert client.post("/subscriptions", headers=headers, json={"name": "X", "price_cents": 100, "billing_cycle": "weekly"}).status_code == 422
    assert client.post("/subscriptions", headers=headers, json={"name": "X", "price_cents": 100, "split_with": 0}).status_code == 422


def test_unknown_category_becomes_other(client):
    headers = signup(client)
    assert add_sub(client, headers, category="Space Travel")["category"] == "Other"


def test_next_billing_date_is_filled_in_when_missing(client):
    headers = signup(client)
    assert add_sub(client, headers)["next_billing_date"] is not None


def test_cancel_and_reactivate_track_cancelled_at(client):
    headers = signup(client)
    sub = add_sub(client, headers)
    cancelled = client.patch(f"/subscriptions/{sub['id']}", headers=headers, json={"status": "cancelled"}).json()
    assert cancelled["status"] == "cancelled" and cancelled["cancelled_at"] is not None
    active = client.patch(f"/subscriptions/{sub['id']}", headers=headers, json={"status": "active"}).json()
    assert active["cancelled_at"] is None


def test_users_cannot_see_or_change_each_others_subscriptions(client):
    alice = signup(client, "alice@example.com", ip=1)
    bob = signup(client, "bob@example.com", ip=2)
    sub = add_sub(client, alice)

    assert client.get("/subscriptions", headers=bob).json() == []
    assert client.patch(f"/subscriptions/{sub['id']}", headers=bob, json={"price_cents": 1}).status_code == 404
    assert client.delete(f"/subscriptions/{sub['id']}", headers=bob).status_code == 404
    assert client.get("/subscriptions", headers=alice).json()[0]["price_cents"] == 1299


def test_subscriptions_require_login(client):
    assert client.get("/subscriptions").status_code == 401
    assert client.post("/subscriptions", json={"name": "X", "price_cents": 1}).status_code == 401
