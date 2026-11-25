"""Registration, email confirmation, login, logout, password reset, .edu verification, account deletion."""
import logging
import re

from conftest import PASSWORD, confirmation_code, ip_header, register, signup
from database import SessionLocal
from models.db import User
from services.email_service import email_service


def test_login_is_blocked_until_the_email_is_confirmed(client):
    register(client, "new@example.com")
    r = client.post("/auth/login", json={"email": "new@example.com", "password": PASSWORD}, headers=ip_header(1))
    assert r.status_code == 403
    assert r.json()["detail"] == "email_not_confirmed"


def test_wrong_confirmation_code_is_rejected_and_right_one_accepted(client):
    register(client, "new@example.com")
    code = confirmation_code("new@example.com")
    wrong = "000000" if code != "000000" else "111111"
    assert client.post("/auth/confirm-email", json={"email": "new@example.com", "code": wrong}).status_code == 400
    assert client.post("/auth/confirm-email", json={"email": "new@example.com", "code": code}).status_code == 200
    r = client.post("/auth/login", json={"email": "new@example.com", "password": PASSWORD}, headers=ip_header(1))
    assert r.status_code == 200 and r.json()["access_token"]


def test_registering_a_confirmed_email_again_fails(client):
    signup(client, "taken@example.com")
    assert register(client, "taken@example.com").status_code == 400


def test_short_password_is_rejected(client):
    assert register(client, "short@example.com", password="1234567").status_code == 422


def test_wrong_password_gives_401(client):
    signup(client)
    r = client.post("/auth/login", json={"email": "student@example.com", "password": "not-the-password"}, headers=ip_header(1))
    assert r.status_code == 401


def test_logout_revokes_the_token(client):
    headers = signup(client)
    assert client.get("/users/me", headers=headers).status_code == 200
    assert client.post("/auth/logout", headers=headers).status_code == 200
    r = client.get("/users/me", headers=headers)
    assert r.status_code == 401
    assert r.json()["detail"] == "Token has been revoked"


def test_garbage_token_gives_401(client):
    assert client.get("/users/me", headers={"Authorization": "Bearer not-a-jwt"}).status_code == 401


def test_password_reset_flow(client):
    signup(client)
    assert client.post("/auth/forgot-password", json={"email": "student@example.com"}).status_code == 200
    session = SessionLocal()
    code = session.query(User).filter_by(email="student@example.com").one().reset_code
    session.close()
    r = client.post("/auth/reset-password", json={"email": "student@example.com", "code": code, "new_password": "brand-new-password"})
    assert r.status_code == 200
    old = client.post("/auth/login", json={"email": "student@example.com", "password": PASSWORD}, headers=ip_header(2))
    new = client.post("/auth/login", json={"email": "student@example.com", "password": "brand-new-password"}, headers=ip_header(2))
    assert old.status_code == 401 and new.status_code == 200


def test_forgot_password_does_not_reveal_unknown_emails(client):
    r = client.post("/auth/forgot-password", json={"email": "nobody@example.com"})
    assert r.status_code == 200


def test_edu_code_goes_only_to_the_edu_address(client, monkeypatch):
    sent = []
    monkeypatch.setattr(email_service, "send_verification_code", lambda to, code: sent.append(to) or True)
    headers = signup(client)
    assert client.post("/auth/verify-edu", headers=headers, json={"edu_email": "me@school.edu"}).status_code == 200
    assert sent == ["me@school.edu"]

    session = SessionLocal()
    code = session.query(User).filter_by(email="student@example.com").one().edu_verification_code
    session.close()
    r = client.post("/auth/verify-edu/confirm", headers=headers, json={"code": code})
    assert r.status_code == 200 and r.json()["is_verified"] is True
    assert client.get("/users/me", headers=headers).json()["is_verified"] is True


def test_non_edu_address_is_rejected(client):
    headers = signup(client)
    assert client.post("/auth/verify-edu", headers=headers, json={"edu_email": "me@gmail.com"}).status_code == 422


def test_edu_errors_do_not_leak_exception_text(client, monkeypatch):
    def boom(to, code):
        raise RuntimeError("smtp password=hunter2")
    monkeypatch.setattr(email_service, "send_verification_code", boom)
    headers = signup(client)
    r = client.post("/auth/verify-edu", headers=headers, json={"edu_email": "me@school.edu"})
    assert r.status_code == 500
    assert "hunter2" not in r.text


def test_codes_are_not_logged_in_production(client, caplog):
    with caplog.at_level(logging.WARNING):
        register(client, "quiet@example.com")
    code = confirmation_code("quiet@example.com")
    assert code not in caplog.text
    assert not re.search(r"\b\d{6}\b", caplog.text)


def test_codes_are_logged_in_development(client, caplog, monkeypatch):
    from config import settings
    monkeypatch.setattr(settings, "environment", "development")
    with caplog.at_level(logging.WARNING):
        register(client, "dev@example.com")
    assert confirmation_code("dev@example.com") in caplog.text


def test_account_deletion_requires_the_password(client):
    headers = signup(client)
    assert client.request("DELETE", "/users/me", headers=headers, json={"password": "wrong"}).status_code == 403
    assert client.request("DELETE", "/users/me", headers=headers, json={"password": PASSWORD}).status_code == 204
    r = client.post("/auth/login", json={"email": "student@example.com", "password": PASSWORD}, headers=ip_header(3))
    assert r.status_code == 401
