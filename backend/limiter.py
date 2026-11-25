"""Shared rate limiter instance — import this in main.py AND all routers."""
import secrets

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from config import settings


def from_proxy(request: Request) -> bool:
    """True when the request carries the secret shared with the Next.js proxy."""
    expected = settings.proxy_shared_secret
    if not expected:
        return False
    given = request.headers.get("x-proxy-secret", "")
    return secrets.compare_digest(given.encode(), expected.encode())


def client_ip(request: Request) -> str:
    """Return the address rate limits are counted against.

    Requests from our own proxy carry the visitor's address in X-Client-IP.

    Otherwise, behind reverse proxies the socket address is the proxy, so every user
    would share one bucket. X-Forwarded-For can be forged by the client, but
    each trusted proxy appends the address it received the request from, so
    the entry TRUSTED_PROXY_COUNT positions from the right was written by our
    own infrastructure. Entries further left are client-supplied and ignored.
    """
    if from_proxy(request) and request.headers.get("x-client-ip"):
        return request.headers["x-client-ip"].strip()
    hops = settings.trusted_proxy_count
    if hops > 0:
        forwarded = [p.strip() for p in request.headers.get("x-forwarded-for", "").split(",") if p.strip()]
        if forwarded:
            return forwarded[max(0, len(forwarded) - hops)]
    return get_remote_address(request)


# Single shared limiter — must be the same object registered in app.state.limiter
limiter = Limiter(key_func=client_ip)
