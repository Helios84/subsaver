"""Shared test setup.

Every test runs against a fresh SQLite database in a temporary folder. The
settings are fixed here, before the app is imported, so a local backend/.env
(which may point at a real database) is never used for anything that matters.
"""
import os
import tempfile

_DB_PATH = os.path.join(tempfile.mkdtemp(prefix="subsaver-tests-"), "test.db")
os.environ.update({
    "DATABASE_URL": f"sqlite:///{_DB_PATH}",
    "JWT_SECRET": "test-only-secret",
    "ENVIRONMENT": "production",
    "SMTP_HOST": "",
    "SMTP_USER": "",
    "SMTP_PASSWORD": "",
    "DEMO_ENABLED": "true",
    "DEMO_MAX_USERS": "500",
    "TRUSTED_PROXY_COUNT": "1",
    "PROXY_SHARED_SECRET": "",
})

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import models  # noqa: E402,F401  (registers all ORM models)
from config import settings  # noqa: E402
from database import Base, SessionLocal, engine  # noqa: E402
from limiter import limiter  # noqa: E402
from main import app  # noqa: E402
from models.db import User  # noqa: E402
from models.student_discount import StudentDiscount  # noqa: E402

assert settings.database_url.startswith("sqlite:///"), "tests must never run against a real database"

PASSWORD = "correct-horse-battery"


@pytest.fixture(autouse=True)
def fresh_db():
    """Empty schema and empty rate-limit counters for every test."""
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    limiter.reset()
    yield


@pytest.fixture
def client():
    # Not used as a context manager on purpose: the app's lifespan would start
    # the background scheduler. Scheduled jobs are tested by calling them directly.
    return TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


def ip_header(n: int) -> dict:
    """A distinct client address (TRUSTED_PROXY_COUNT=1 makes the API read it)."""
    return {"X-Forwarded-For": f"203.0.113.{n}"}


def register(client, email: str, password: str = PASSWORD, ip: int = 1):
    return client.post("/auth/register", json={"email": email, "password": password}, headers=ip_header(ip))


def confirmation_code(email: str) -> str:
    session = SessionLocal()
    try:
        return session.query(User).filter_by(email=email).one().verification_code
    finally:
        session.close()


def signup(client, email: str = "student@example.com", password: str = PASSWORD, ip: int = 1) -> dict:
    """Register, confirm and log in. Returns request headers with the bearer token."""
    assert register(client, email, password, ip).status_code == 200
    assert client.post("/auth/confirm-email", json={"email": email, "code": confirmation_code(email)},
                       headers=ip_header(ip)).status_code == 200
    r = client.post("/auth/login", json={"email": email, "password": password}, headers=ip_header(ip))
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}", **ip_header(ip)}


def add_sub(client, headers: dict, **fields) -> dict:
    body = {"name": "Spotify", "price_cents": 1299, "billing_cycle": "monthly", **fields}
    r = client.post("/subscriptions", headers=headers, json=body)
    assert r.status_code == 200, r.text
    return r.json()


def add_discount(name: str, regular: int, student: int, category: str = "Entertainment") -> None:
    session = SessionLocal()
    session.add(StudentDiscount(
        service_name=name, category=category, regular_price_cents=regular, student_price_cents=student,
        discount_percentage=round((regular - student) * 100 / regular), requirements="[]",
        verification_method="sheerid", direct_link="https://example.com/student",
    ))
    session.commit()
    session.close()
