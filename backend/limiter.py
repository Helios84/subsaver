"""Shared rate limiter instance — import this in main.py AND all routers."""
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from config import settings


def client_ip(request: Request) -> str:
    """Return the address rate limits are counted against.

    Behind reverse proxies the socket address is the proxy, so every user
    would share one bucket. X-Forwarded-For can be forged by the client, but
    each trusted proxy appends the address it received the request from, so
    the entry TRUSTED_PROXY_COUNT positions from the right was written by our
    own infrastructure. Entries further left are client-supplied and ignored.
    """
    hops = settings.trusted_proxy_count
    if hops > 0:
        forwarded = [p.strip() for p in request.headers.get("x-forwarded-for", "").split(",") if p.strip()]
        if forwarded:
            return forwarded[max(0, len(forwarded) - hops)]
    return get_remote_address(request)


# Single shared limiter — must be the same object registered in app.state.limiter
limiter = Limiter(key_func=client_ip)
