"""Categories router — provides a single source of truth for subscription categories.
Frontend fetches this instead of maintaining a separate hardcoded list.
"""
from fastapi import APIRouter
from typing import List

from schemas.subscription import CATEGORIES

router = APIRouter(prefix="/api/categories", tags=["categories"])


CATEGORY_META = {
    "Entertainment":   {"icon": "🎬", "color": "#8B5CF6"},
    "Productivity":    {"icon": "💼", "color": "#D946EF"},
    "Gaming":          {"icon": "🎮", "color": "#06B6D4"},
    "Utilities":       {"icon": "🔧", "color": "#6366F1"},
    "Communication":   {"icon": "📱", "color": "#10B981"},
    "Health & Fitness":{"icon": "🏋️", "color": "#EC4899"},
    "Health":          {"icon": "❤️", "color": "#F43F5E"},
    "Education":       {"icon": "📚", "color": "#A78BFA"},
    "Food & Delivery": {"icon": "🍔", "color": "#34D399"},
    "News & Media":    {"icon": "📰", "color": "#EAB308"},
    "Finance":         {"icon": "💳", "color": "#F97316"},
    "Other":           {"icon": "🎨", "color": "#64748B"},
}


@router.get("", tags=["categories"])
def list_categories():
    """
    Return all valid subscription categories with icon and color metadata.
    Use this as the single source of truth — avoids duplication between frontend and backend.
    """
    result = []
    for cat in sorted(CATEGORIES):
        meta = CATEGORY_META.get(cat, {"icon": "📦", "color": "#64748B"})
        result.append({
            "value": cat,
            "icon": meta["icon"],
            "color": meta["color"],
        })
    return result
