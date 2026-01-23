"""
Seed script to populate the student_discounts table with top 25 student services.
Run this after creating the database tables.

Usage: python seed_student_discounts.py
"""

import os
import sys
import json
from dotenv import load_dotenv

load_dotenv()

# Import from main.py to use the same engine and Base
from main import engine, SessionLocal, Base
from models.student_discount import StudentDiscount

# Create tables
Base.metadata.create_all(bind=engine)

# Top 25 student discounts
STUDENT_DISCOUNTS = [
    {
        "service_name": "Spotify Premium",
        "category": "Entertainment",
        "regular_price_cents": 1099,  # $10.99
        "student_price_cents": 599,   # $5.99
        "discount_percentage": 45,
        "requirements": json.dumps(["Valid .edu email address", "Enrolled at accredited institution"]),
        "verification_method": "sheerid",
        "direct_link": "https://www.spotify.com/us/student/",
        "availability": "US,UK,CA,AU",
        "notes": "Must verify student status annually. Includes Hulu and SHOWTIME."
    },
    {
        "service_name": "Apple Music",
        "category": "Entertainment",
        "regular_price_cents": 1099,
        "student_price_cents": 599,
        "discount_percentage": 45,
        "requirements": json.dumps(["Valid .edu email or UNiDAYS verification"]),
        "verification_method": "unidays",
        "direct_link": "https://www.apple.com/apple-music/student/",
        "availability": "US,UK,CA,AU",
        "notes": "Includes Apple TV+ for free. Verify annually."
    },
    {
        "service_name": "YouTube Premium",
        "category": "Entertainment",
        "regular_price_cents": 1399,
        "student_price_cents": 799,
        "discount_percentage": 43,
        "requirements": json.dumps(["SheerID verification", "Valid student ID"]),
        "verification_method": "sheerid",
        "direct_link": "https://www.youtube.com/premium/student",
        "availability": "US,UK,CA,AU",
        "notes": "Includes YouTube Music Premium. Ad-free viewing."
    },
    {
        "service_name": "Amazon Prime Student",
        "category": "Shopping",
        "regular_price_cents": 1499,
        "student_price_cents": 749,
        "discount_percentage": 50,
        "requirements": json.dumps(["Valid .edu email", "Enrolled student"]),
        "verification_method": "edu_email",
        "direct_link": "https://www.amazon.com/amazonprime?_encoding=UTF8&primeCampaignId=studentWlpPrimeRedir",
        "availability": "US",
        "notes": "6 months FREE trial, then $7.49/month. Includes Prime Video, Music, and free shipping."
    },
    {
        "service_name": "Hulu",
        "category": "Entertainment",
        "regular_price_cents": 799,
        "student_price_cents": 199,
        "discount_percentage": 75,
        "requirements": json.dumps(["SheerID verification"]),
        "verification_method": "sheerid",
        "direct_link": "https://www.hulu.com/student",
        "availability": "US",
        "notes": "Ad-supported plan. Often bundled with Spotify Student."
    },
    {
        "service_name": "Adobe Creative Cloud",
        "category": "Productivity",
        "regular_price_cents": 5999,
        "student_price_cents": 1999,
        "discount_percentage": 67,
        "requirements": json.dumps(["Valid student ID", "Enrolled at accredited institution"]),
        "verification_method": "manual",
        "direct_link": "https://www.adobe.com/creativecloud/buy/students.html",
        "availability": "US,UK,CA,AU",
        "notes": "All apps included. Must verify student status. Huge savings!"
    },
    {
        "service_name": "Microsoft 365",
        "category": "Productivity",
        "regular_price_cents": 699,
        "student_price_cents": 0,
        "discount_percentage": 100,
        "requirements": json.dumps(["Valid .edu email from eligible institution"]),
        "verification_method": "edu_email",
        "direct_link": "https://www.microsoft.com/en-us/education/products/office",
        "availability": "US,UK,CA,AU",
        "notes": "Completely FREE for eligible students! Includes Word, Excel, PowerPoint, OneNote."
    },
    {
        "service_name": "GitHub Pro",
        "category": "Productivity",
        "regular_price_cents": 400,
        "student_price_cents": 0,
        "discount_percentage": 100,
        "requirements": json.dumps(["Valid .edu email", "GitHub Student Developer Pack"]),
        "verification_method": "edu_email",
        "direct_link": "https://education.github.com/pack",
        "availability": "Global",
        "notes": "FREE GitHub Pro + tons of developer tools. Must apply for Student Developer Pack."
    },
    {
        "service_name": "Notion",
        "category": "Productivity",
        "regular_price_cents": 1000,
        "student_price_cents": 0,
        "discount_percentage": 100,
        "requirements": json.dumps(["Valid .edu email"]),
        "verification_method": "edu_email",
        "direct_link": "https://www.notion.so/product/notion-for-education",
        "availability": "Global",
        "notes": "FREE Personal Pro plan for students. Unlimited blocks and file uploads."
    },
    {
        "service_name": "Canva Pro",
        "category": "Productivity",
        "regular_price_cents": 1299,
        "student_price_cents": 0,
        "discount_percentage": 100,
        "requirements": json.dumps(["Valid .edu email", "Verification required"]),
        "verification_method": "edu_email",
        "direct_link": "https://www.canva.com/education/",
        "availability": "Global",
        "notes": "FREE for verified students and teachers. Premium templates and features."
    },
    {
        "service_name": "Headspace",
        "category": "Health & Fitness",
        "regular_price_cents": 1299,
        "student_price_cents": 999,
        "discount_percentage": 23,
        "requirements": json.dumps(["SheerID verification"]),
        "verification_method": "sheerid",
        "direct_link": "https://www.headspace.com/studentplan",
        "availability": "US,UK,CA,AU",
        "notes": "Meditation and mindfulness app. Student discount available."
    },
    {
        "service_name": "Calm",
        "category": "Health & Fitness",
        "regular_price_cents": 1499,
        "student_price_cents": 999,
        "discount_percentage": 33,
        "requirements": json.dumps(["SheerID verification"]),
        "verification_method": "sheerid",
        "direct_link": "https://www.calm.com/students",
        "availability": "US",
        "notes": "Sleep and meditation app. Verify student status for discount."
    },
    {
        "service_name": "Paramount+",
        "category": "Entertainment",
        "regular_price_cents": 599,
        "student_price_cents": 299,
        "discount_percentage": 50,
        "requirements": json.dumps(["SheerID verification"]),
        "verification_method": "sheerid",
        "direct_link": "https://www.paramountplus.com/account/signup/student/",
        "availability": "US",
        "notes": "Essential plan with ads. 50% off for students."
    },
    {
        "service_name": "Peacock Premium",
        "category": "Entertainment",
        "regular_price_cents": 599,
        "student_price_cents": 199,
        "discount_percentage": 67,
        "requirements": json.dumps(["Valid .edu email"]),
        "verification_method": "edu_email",
        "direct_link": "https://www.peacocktv.com/student",
        "availability": "US",
        "notes": "Huge discount on Peacock Premium. NBC shows and movies."
    },
    {
        "service_name": "Tidal",
        "category": "Entertainment",
        "regular_price_cents": 1099,
        "student_price_cents": 549,
        "discount_percentage": 50,
        "requirements": json.dumps(["SheerID verification"]),
        "verification_method": "sheerid",
        "direct_link": "https://tidal.com/student",
        "availability": "US,UK,CA",
        "notes": "HiFi music streaming. 50% off for students."
    },
    {
        "service_name": "Skillshare",
        "category": "Education",
        "regular_price_cents": 3200,
        "student_price_cents": 9900,
        "discount_percentage": 50,
        "requirements": json.dumps(["Valid .edu email"]),
        "verification_method": "edu_email",
        "direct_link": "https://www.skillshare.com/student",
        "availability": "Global",
        "notes": "Annual plan. 50% off for students. Thousands of creative courses."
    },
    {
        "service_name": "Grammarly Premium",
        "category": "Productivity",
        "regular_price_cents": 1200,
        "student_price_cents": 600,
        "discount_percentage": 50,
        "requirements": json.dumps(["Valid .edu email"]),
        "verification_method": "edu_email",
        "direct_link": "https://www.grammarly.com/edu",
        "availability": "Global",
        "notes": "Writing assistant. 50% off for students."
    },
    {
        "service_name": "Autodesk",
        "category": "Productivity",
        "regular_price_cents": 21500,
        "student_price_cents": 0,
        "discount_percentage": 100,
        "requirements": json.dumps(["Valid .edu email", "Student ID"]),
        "verification_method": "edu_email",
        "direct_link": "https://www.autodesk.com/education/free-software/featured",
        "availability": "Global",
        "notes": "FREE for students! AutoCAD, Maya, 3ds Max, and more."
    },
    {
        "service_name": "Figma",
        "category": "Productivity",
        "regular_price_cents": 1500,
        "student_price_cents": 0,
        "discount_percentage": 100,
        "requirements": json.dumps(["Valid .edu email"]),
        "verification_method": "edu_email",
        "direct_link": "https://www.figma.com/education/",
        "availability": "Global",
        "notes": "FREE Professional plan for students. Design and prototyping tool."
    },
    {
        "service_name": "Dropbox Plus",
        "category": "Productivity",
        "regular_price_cents": 1199,
        "student_price_cents": 599,
        "discount_percentage": 50,
        "requirements": json.dumps(["Valid .edu email"]),
        "verification_method": "edu_email",
        "direct_link": "https://www.dropbox.com/students",
        "availability": "Global",
        "notes": "2TB cloud storage. 50% off for students."
    },
    {
        "service_name": "LastPass Premium",
        "category": "Utilities",
        "regular_price_cents": 300,
        "student_price_cents": 0,
        "discount_percentage": 100,
        "requirements": json.dumps(["Valid .edu email"]),
        "verification_method": "edu_email",
        "direct_link": "https://www.lastpass.com/education",
        "availability": "Global",
        "notes": "FREE for 6 months, then discounted. Password manager."
    },
    {
        "service_name": "The New York Times",
        "category": "Education",
        "regular_price_cents": 1700,
        "student_price_cents": 100,
        "discount_percentage": 94,
        "requirements": json.dumps(["Valid .edu email"]),
        "verification_method": "edu_email",
        "direct_link": "https://www.nytimes.com/subscription/education/student",
        "availability": "US",
        "notes": "Digital access for just $1/week. Incredible deal for students."
    },
    {
        "service_name": "The Washington Post",
        "category": "Education",
        "regular_price_cents": 1000,
        "student_price_cents": 0,
        "discount_percentage": 100,
        "requirements": json.dumps(["Valid .edu email"]),
        "verification_method": "edu_email",
        "direct_link": "https://subscribe.washingtonpost.com/acq/#/offers/promo/o17",
        "availability": "US",
        "notes": "FREE for students with .edu email. Digital access."
    },
    {
        "service_name": "Wall Street Journal",
        "category": "Education",
        "regular_price_cents": 3900,
        "student_price_cents": 400,
        "discount_percentage": 90,
        "requirements": json.dumps(["Valid .edu email"]),
        "verification_method": "edu_email",
        "direct_link": "https://store.wsj.com/shop/us/us/wsjusstudent19",
        "availability": "US",
        "notes": "Digital access. Massive discount for students."
    },
    {
        "service_name": "SiriusXM",
        "category": "Entertainment",
        "regular_price_cents": 999,
        "student_price_cents": 499,
        "discount_percentage": 50,
        "requirements": json.dumps(["SheerID verification"]),
        "verification_method": "sheerid",
        "direct_link": "https://www.siriusxm.com/student-discount",
        "availability": "US,CA",
        "notes": "Streaming plan. 50% off for students."
    }
]


def seed_discounts():
    """Populate the database with student discounts"""
    db = SessionLocal()
    
    try:
        # Check if already seeded
        existing_count = db.query(StudentDiscount).count()
        if existing_count > 0:
            print(f"[WARN] Database already contains {existing_count} discounts.")
            if "--force" not in sys.argv:
                print("Skipping re-seed to prevent data loss. Use --force to clear and re-seed.")
                return
            
            print("Force mode detected. Proceeding to re-seed...")
            
            # Clear existing
            db.query(StudentDiscount).delete()
            db.commit()
            print("[OK] Cleared existing discounts")
        
        # Insert new discounts
        for discount_data in STUDENT_DISCOUNTS:
            discount = StudentDiscount(**discount_data)
            db.add(discount)
        
        db.commit()
        print(f"[OK] Successfully seeded {len(STUDENT_DISCOUNTS)} student discounts!")
        
        # Print summary
        print("\n[INFO] Summary by category:")
        categories = {}
        for d in STUDENT_DISCOUNTS:
            cat = d['category']
            categories[cat] = categories.get(cat, 0) + 1
        
        for cat, count in sorted(categories.items()):
            print(f"   {cat}: {count} services")
        
        # Print some highlights
        print("\n[INFO] Top FREE services:")
        free_services = [d for d in STUDENT_DISCOUNTS if d['student_price_cents'] == 0]
        for service in free_services[:5]:
            print(f"   - {service['service_name']}")
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding discounts: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding student discounts database...\n")
    seed_discounts()
