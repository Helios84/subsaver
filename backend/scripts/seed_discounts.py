"""
Seed script for the student_discounts table.

The catalog lists only services with an official US student offer page. Every
entry carries that page as `source_url` and the date its prices were checked.
Prices are US monthly prices in cents.

The script is idempotent and runs on every deploy:
  - entries below are inserted or updated,
  - catalog rows that are no longer listed are switched off (is_active = False).

Usage:
    cd backend
    python scripts/seed_discounts.py
"""
import sys
import os
from datetime import date

# Force UTF-8 output on Windows (avoids cp1252 encoding errors)
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Ensure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models.student_discount import StudentDiscount
from models.db import User, Subscription  # noqa: F401 — registers ORM models

# Date the prices below were last compared with the providers' pages.
CHECKED_ON = date(2026, 11, 25)

# (service_name, category, regular_cents, student_cents, requirements,
#  verification_method, source_url, notes)
DISCOUNTS = [
    # ─── Entertainment ───────────────────────────────────────────────────────
    ("Spotify", "Entertainment", 1299, 699,
     '["Enrolled at an accredited college or university", "SheerID verification"]', "sheerid",
     "https://www.spotify.com/us/student/",
     "Premium Student. Re-verify every 12 months, for up to 4 years."),
    ("Apple Music", "Entertainment", 1199, 699,
     '["Enrolled at a degree-granting college or university", "Student verification"]', "unidays",
     "https://www.apple.com/apple-music/",
     "Student plan, available for up to 48 months."),
    ("YouTube Premium", "Entertainment", 1599, 899,
     '["Enrolled at an approved higher education institution", "SheerID verification"]', "sheerid",
     "https://www.youtube.com/premium/student",
     "Student membership, verified yearly for up to 4 years. Price as reported after the April 2026 US price change."),
    ("Amazon Prime", "Entertainment", 1499, 749,
     '["Higher education student or age 18-24", "Verification by Amazon"]', "edu_email",
     "https://www.amazon.com/amazonprime/prime-student",
     "Prime for Young Adults (formerly Prime Student): 6-month trial, then the discounted rate."),
    ("Tidal", "Entertainment", 1199, 699,
     '["College student, or US high school student aged 16+", "Student verification"]', "sheerid",
     "https://tidal.com/plans/student",
     "Student plan. Re-verify every 11 months."),
    ("Peacock Premium", "Entertainment", 1299, 699,
     '["Enrolled at a college or university", "SheerID verification"]', "sheerid",
     "https://www.peacocktv.com/student",
     "Student price applies for 12 months, then the regular price."),
    ("Hulu", "Entertainment", 1199, 199,
     '["Enrolled at an accredited US college or university", "Student verification"]', "sheerid",
     "https://www.hulu.com/student",
     "Hulu (With Ads) student offer, while enrollment stays verified."),

    # ─── Productivity ────────────────────────────────────────────────────────
    ("Adobe Creative Cloud", "Productivity", 6999, 1999,
     '["Student or teacher", "Eligibility verification by Adobe"]', "edu_email",
     "https://www.adobe.com/products/pricing-info/ccste-pricing-info.html",
     "Creative Cloud Pro for students and teachers: first-year price on an annual plan billed monthly. It renews at a higher student rate."),
    ("Microsoft 365 Personal", "Productivity", 999, 499,
     '["Enrolled at an accredited college or university", "Student verification by Microsoft"]', "edu_email",
     "https://www.microsoft.com/en/microsoft-365/college-student-pricing",
     "College student price for Microsoft 365 Personal."),
    ("Notion", "Productivity", 1000, 0,
     '["School email address at an accredited college or university"]', "edu_email",
     "https://www.notion.com/product/notion-for-education",
     "Education Plus plan is free for individual students; regular price is the Plus plan per seat."),
    ("Figma", "Productivity", 1600, 0,
     '["Student or educator", "Education status verification"]', "edu_email",
     "https://www.figma.com/education/",
     "Education plan gives the Professional plan free; regular price is one full seat."),

    # ─── Food & Delivery ─────────────────────────────────────────────────────
    ("DoorDash DashPass", "Food & Delivery", 999, 499,
     '["College student", "SheerID verification"]', "sheerid",
     "https://help.doordash.com/en-us/consumers/article/dashpass-for-students",
     "DashPass for Students."),
    ("Uber One", "Food & Delivery", 999, 499,
     '["Student aged 18+", "Student verification, renewed yearly"]', "sheerid",
     "https://www.uber.com/us/en/uber-one/student/",
     "Uber One for Students."),
]


def seed():
    db = SessionLocal()
    try:
        added = updated = 0
        listed = set()

        for (name, category, regular_cents, student_cents, requirements,
             verification_method, source_url, notes) in DISCOUNTS:
            listed.add(name)
            values = dict(
                category=category,
                regular_price_cents=regular_cents,
                student_price_cents=student_cents,
                discount_percentage=round((regular_cents - student_cents) * 100 / regular_cents),
                requirements=requirements,
                verification_method=verification_method,
                direct_link=source_url,
                source_url=source_url,
                price_checked_on=CHECKED_ON,
                availability="US",
                notes=notes,
                is_active=True,
            )
            row = db.query(StudentDiscount).filter(StudentDiscount.service_name == name).first()
            if row is None:
                db.add(StudentDiscount(service_name=name, **values))
                added += 1
            else:
                for key, value in values.items():
                    setattr(row, key, value)
                updated += 1

        # Entries that are no longer in the catalog stay in the table but are hidden.
        retired = 0
        for row in db.query(StudentDiscount).filter(StudentDiscount.is_active == True).all():  # noqa: E712
            if row.service_name not in listed:
                row.is_active = False
                retired += 1

        db.commit()
        active = db.query(StudentDiscount).filter(StudentDiscount.is_active == True).count()  # noqa: E712
        print(f"Catalog seeded: {added} added, {updated} updated, {retired} retired. Active entries: {active}")

    except Exception as e:
        db.rollback()
        import traceback
        print(f"Error: {e}")
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
