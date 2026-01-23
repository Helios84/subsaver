"""
Simple seed script for student discounts.
Run: python seed_discounts_simple.py
"""

import os
import json
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Create engine
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./subsaver.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Import model (tables will be created by main.py)
from models.student_discount import StudentDiscount

# Data
DISCOUNTS = [
    {"service_name": "Spotify Premium", "category": "Entertainment", "regular_price_cents": 1099, "student_price_cents": 599, "discount_percentage": 45, "requirements": json.dumps(["Valid .edu email", "Enrolled at accredited institution"]), "verification_method": "sheerid", "direct_link": "https://www.spotify.com/us/student/", "availability": "US,UK,CA,AU", "notes": "Must verify annually. Includes Hulu and SHOWTIME."},
    {"service_name": "Apple Music", "category": "Entertainment", "regular_price_cents": 1099, "student_price_cents": 599, "discount_percentage": 45, "requirements": json.dumps(["Valid .edu email or UNiDAYS"]), "verification_method": "unidays", "direct_link": "https://www.apple.com/apple-music/student/", "availability": "US,UK,CA,AU", "notes": "Includes Apple TV+ free. Verify annually."},
    {"service_name": "YouTube Premium", "category": "Entertainment", "regular_price_cents": 1399, "student_price_cents": 799, "discount_percentage": 43, "requirements": json.dumps(["SheerID verification", "Valid student ID"]), "verification_method": "sheerid", "direct_link": "https://www.youtube.com/premium/student", "availability": "US,UK,CA,AU", "notes": "Includes YouTube Music Premium. Ad-free."},
    {"service_name": "Amazon Prime Student", "category": "Shopping", "regular_price_cents": 1499, "student_price_cents": 749, "discount_percentage": 50, "requirements": json.dumps(["Valid .edu email"]), "verification_method": "edu_email", "direct_link": "https://www.amazon.com/amazonprime", "availability": "US", "notes": "6 months FREE, then $7.49/month. Includes Prime Video, Music, shipping."},
    {"service_name": "Hulu", "category": "Entertainment", "regular_price_cents": 799, "student_price_cents": 199, "discount_percentage": 75, "requirements": json.dumps(["SheerID verification"]), "verification_method": "sheerid", "direct_link": "https://www.hulu.com/student", "availability": "US", "notes": "Ad-supported. Often bundled with Spotify Student."},
    {"service_name": "Adobe Creative Cloud", "category": "Productivity", "regular_price_cents": 5999, "student_price_cents": 1999, "discount_percentage": 67, "requirements": json.dumps(["Valid student ID"]), "verification_method": "manual", "direct_link": "https://www.adobe.com/creativecloud/buy/students.html", "availability": "US,UK,CA,AU", "notes": "All apps included. Huge savings!"},
    {"service_name": "Microsoft 365", "category": "Productivity", "regular_price_cents": 699, "student_price_cents": 0, "discount_percentage": 100, "requirements": json.dumps(["Valid .edu email"]), "verification_method": "edu_email", "direct_link": "https://www.microsoft.com/en-us/education/products/office", "availability": "US,UK,CA,AU", "notes": "Completely FREE! Includes Word, Excel, PowerPoint, OneNote."},
    {"service_name": "GitHub Pro", "category": "Productivity", "regular_price_cents": 400, "student_price_cents": 0, "discount_percentage": 100, "requirements": json.dumps(["Valid .edu email"]), "verification_method": "edu_email", "direct_link": "https://education.github.com/pack", "availability": "Global", "notes": "FREE GitHub Pro + developer tools."},
    {"service_name": "Notion", "category": "Productivity", "regular_price_cents": 1000, "student_price_cents": 0, "discount_percentage": 100, "requirements": json.dumps(["Valid .edu email"]), "verification_method": "edu_email", "direct_link": "https://www.notion.so/product/notion-for-education", "availability": "Global", "notes": "FREE Personal Pro. Unlimited blocks and uploads."},
    {"service_name": "Canva Pro", "category": "Productivity", "regular_price_cents": 1299, "student_price_cents": 0, "discount_percentage": 100, "requirements": json.dumps(["Valid .edu email"]), "verification_method": "edu_email", "direct_link": "https://www.canva.com/education/", "availability": "Global", "notes": "FREE for students. Premium templates."},
]

def seed():
    db = SessionLocal()
    try:
        count = db.query(StudentDiscount).count()
        if count > 0:
            print(f"✅ Database already has {count} discounts. Skipping.")
            return
        
        for data in DISCOUNTS:
            db.add(StudentDiscount(**data))
        
        db.commit()
        print(f"✅ Seeded {len(DISCOUNTS)} student discounts!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Seeding student discounts...\n")
    seed()
