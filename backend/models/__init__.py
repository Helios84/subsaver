# models package — re-export everything for convenient imports
from .db import User, Subscription
from .student_discount import StudentDiscount

__all__ = ["User", "Subscription", "StudentDiscount"]
