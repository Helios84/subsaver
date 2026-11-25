"""Removed endpoints, rate limits and the shared proxy secret."""
from config import settings
from conftest import ip_header


def login_attempt(client, headers):
    return client.post("/auth/login", json={"email": "x@example.com", "password": "wrong-password"}, headers=headers).status_code


def test_removed_endpoints_stay_removed(client):
    for method, path in [("post", "/auth/verify-registration"), ("post", "/auth/resend-verification"),
                         ("get", "/api/categories"), ("post", "/reminders/send-now"),
                         ("post", "/reminders/test-email"), ("get", "/reminders/upcoming")]:
        assert getattr(client, method)(path).status_code in (404, 405), path


def test_login_rate_limit_counts_each_client_separately(client):
    assert [login_attempt(client, ip_header(10)) for _ in range(6)] == [401] * 5 + [429]
    assert login_attempt(client, ip_header(11)) == 401


def test_a_forged_forwarded_for_entry_does_not_reset_the_limit(client):
    for _ in range(5):
        login_attempt(client, ip_header(12))
    # the client prepends a fake address; the proxy-written (rightmost) entry still counts
    assert login_attempt(client, {"X-Forwarded-For": "1.2.3.4, 203.0.113.12"}) == 429


def test_without_a_proxy_secret_the_api_is_open(client):
    assert client.get("/api/student-discounts").status_code == 200


def test_with_a_proxy_secret_direct_calls_are_rejected(client, monkeypatch):
    monkeypatch.setattr(settings, "proxy_shared_secret", "s3cret")
    assert client.get("/api/student-discounts").status_code == 403
    assert client.get("/api/student-discounts", headers={"X-Proxy-Secret": "wrong"}).status_code == 403
    assert client.get("/api/student-discounts", headers={"X-Proxy-Secret": "s3cret"}).status_code == 200
    # health check and the API description stay public
    assert client.get("/health").status_code == 200
    assert client.get("/openapi.json").status_code == 200


def test_with_a_proxy_secret_rate_limits_use_the_client_ip_from_the_proxy(client, monkeypatch):
    monkeypatch.setattr(settings, "proxy_shared_secret", "s3cret")
    a = {"X-Proxy-Secret": "s3cret", "X-Client-IP": "198.51.100.1"}
    b = {"X-Proxy-Secret": "s3cret", "X-Client-IP": "198.51.100.2"}
    assert [login_attempt(client, a) for _ in range(6)] == [401] * 5 + [429]
    assert login_attempt(client, b) == 401
