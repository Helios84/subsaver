"""Renewal reminders (the daily job) and the Alembic migrations."""
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone

from dateutil.relativedelta import relativedelta

from conftest import add_sub, signup
from models.db import Subscription
from services.email_service import email_service
from services.reminder_service import reminder_service

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def test_reminder_is_sent_once_for_a_renewal_inside_the_window(client, db, monkeypatch):
    sent = []
    monkeypatch.setattr(email_service, "send_reminder_email", lambda **kw: sent.append(kw["subscription_name"]) or True)
    headers = signup(client)
    add_sub(client, headers, name="Soon", next_billing_date=(now() + timedelta(days=3)).isoformat())
    add_sub(client, headers, name="Later", next_billing_date=(now() + timedelta(days=20)).isoformat())

    assert reminder_service.send_reminders(db)["sent"] == 1
    assert sent == ["Soon"]
    assert reminder_service.send_reminders(db)["sent"] == 0   # not sent twice


def test_a_passed_billing_date_moves_to_the_next_cycle(client, db, monkeypatch):
    monkeypatch.setattr(email_service, "send_reminder_email", lambda **kw: True)
    headers = signup(client)
    sub = add_sub(client, headers, name="Gym")
    row = db.get(Subscription, sub["id"])
    past = now() - timedelta(days=2)
    row.next_billing_date, row.reminder_sent = past, True
    db.commit()

    reminder_service.send_reminders(db)
    db.refresh(row)
    assert row.next_billing_date == past + relativedelta(months=1)
    assert row.next_billing_date > now()


def run_alembic(*args, db_path):
    env = {**os.environ, "DATABASE_URL": f"sqlite:///{db_path}"}
    return subprocess.run([sys.executable, "-m", "alembic", *args], cwd=BACKEND_DIR, env=env,
                          capture_output=True, text=True)


def test_migrations_run_on_sqlite_and_match_the_models(tmp_path):
    db_path = tmp_path / "migrations.db"
    upgrade = run_alembic("upgrade", "head", db_path=db_path)
    assert upgrade.returncode == 0, upgrade.stderr
    check = run_alembic("check", db_path=db_path)
    assert check.returncode == 0, check.stdout + check.stderr
