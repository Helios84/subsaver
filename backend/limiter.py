"""Shared rate limiter instance — import this in main.py AND all routers."""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Single shared limiter — must be the same object registered in app.state.limiter
limiter = Limiter(key_func=get_remote_address)
