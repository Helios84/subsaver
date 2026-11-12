"""
FX rates endpoint — serves exchange rates with server-side 1-hour cache.
Replaces direct client-side calls to open.er-api.com, avoiding the 1500 req/month limit.
"""
import time
import logging
from typing import Dict

import httpx
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["rates"])

# ── In-memory cache ───────────────────────────────────────────────────────────
_rates_cache: Dict[str, float] = {}
_cache_timestamp: float = 0.0
_CACHE_TTL = 3600  # 1 hour

FALLBACK_RATES: Dict[str, float] = {
    "USD": 1.0,
    "EUR": 0.93,
    "GBP": 0.79,
}


@router.get("/rates")
async def get_exchange_rates():
    """
    Return USD-based exchange rates.
    Cached server-side for 1 hour — all users share one API call, not one per browser.
    Falls back to hardcoded rates if the upstream API is unavailable.
    """
    global _rates_cache, _cache_timestamp

    now = time.time()
    if _rates_cache and (now - _cache_timestamp) < _CACHE_TTL:
        return {"rates": _rates_cache, "cached": True}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get("https://open.er-api.com/v6/latest/USD")
            resp.raise_for_status()
            data = resp.json()
            _rates_cache = data.get("rates", FALLBACK_RATES)
            _cache_timestamp = now
            return {"rates": _rates_cache, "cached": False}
    except Exception as exc:
        logger.warning(f"[rates] Failed to fetch exchange rates: {exc}. Using fallback.")
        if _rates_cache:
            return {"rates": _rates_cache, "cached": True}
        return {"rates": FALLBACK_RATES, "cached": False, "fallback": True}
