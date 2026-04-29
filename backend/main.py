"""
SubSaver API — main entry point.
Models, schemas, and routers are in their own modules.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter  # shared singleton — same instance used in all routers

from config import settings

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Rate Limiter (shared singleton — imported from limiter.py) ────────────────

# ── Database: import engine/session + register all ORM models with Base ──────
from database import engine, Base, SessionLocal
import models  # noqa: F401 — registers all ORM models with Base
# NOTE: Schema is managed by Alembic — run `alembic upgrade head` to apply migrations.

# ── Scheduler ─────────────────────────────────────────────────────────────────
from services.scheduler import reminder_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    reminder_scheduler.set_db_session_maker(SessionLocal)
    reminder_scheduler.start()
    logger.info("✅ Reminder scheduler started")
    yield
    reminder_scheduler.stop()
    logger.info("Reminder scheduler stopped")


# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="SubSaver API",
    description="Subscription management platform for students",
    version="2.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
from routers.auth import router as auth_router
from routers.subscriptions import router as subscriptions_router
from routers.reminders import router as reminder_router
from routers.student_discounts import router as student_discounts_router
from routers.analytics import router as analytics_router
from routers.categories import router as categories_router

app.include_router(auth_router)
app.include_router(subscriptions_router)
app.include_router(reminder_router)
app.include_router(student_discounts_router)
app.include_router(analytics_router)
app.include_router(categories_router)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
def health():
    return {"status": "ok", "db": "postgresql" if not settings.database_url.startswith("sqlite") else "sqlite"}
