"""
Seed script for student_discounts table.
Populates the database with real student discount data for 60+ popular services.

Usage:
    cd backend
    python scripts/seed_discounts.py
"""
import sys
import os

# Force UTF-8 output on Windows (avoids cp1252 emoji encoding errors)
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Ensure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from database import SessionLocal, engine, Base
from models.student_discount import StudentDiscount
from models.db import User, Subscription  # noqa: registers ORM models

# ── Sample data ─────────────────────────────────────────────────────────────
# Format: (service_name, category, regular_cents, student_cents, discount_pct,
#          requirements, verification_method, direct_link, availability, notes)

DISCOUNTS = [
    # ─── Music / Entertainment ───────────────────────────────────────────────
    ("Spotify", "Entertainment",
     999, 499, 50,
     '["Active .edu email", "SheerID verification"]', "sheerid",
     "https://www.spotify.com/us/student/", "US,CA,AU,UK",
     "Includes Hulu (ad-supported) and SHOWTIME in US. Renew annually."),

    ("Apple Music", "Entertainment",
     1099, 599, 45,
     '["Apple ID with student verification"]', "unidays",
     "https://www.apple.com/shop/buy-music/unlimited/student", "US,CA,UK,AU",
     "Verified through UNiDAYS. Includes Apple TV+ for free."),

    ("YouTube Premium", "Entertainment",
     1399, 799, 43,
     '["Google account", "SheerID verification"]', "sheerid",
     "https://www.youtube.com/premium/student", "US,CA,UK",
     "Ad-free YouTube + YouTube Music. 1-year eligibility check."),

    ("Amazon Prime", "Entertainment",
     1499, 799, 47,
     '["Active .edu email"]', "edu_email",
     "https://www.amazon.com/prime/promo/studenteligible", "US",
     "6-month free trial, then 50% off. Prime Video, Prime Shipping, Prime Music included."),

    ("Tidal", "Entertainment",
     1099, 599, 45,
     '["SheerID student verification"]', "sheerid",
     "https://tidal.com/student", "US,UK,CA",
     "HiFi audio quality at student price. Renew yearly."),

    ("SoundCloud Go+", "Entertainment",
     999, 499, 50,
     '["SheerID verification"]', "sheerid",
     "https://soundcloud.com/go/students", "US",
     "Offline listening + ad-free experience."),

    ("Pandora Premium", "Entertainment",
     999, 499, 50,
     '["SheerID verification"]', "sheerid",
     "https://www.pandora.com/account/register?v=premium-student", "US",
     "On-demand listening, offline downloads."),

    # ─── Video Streaming ─────────────────────────────────────────────────────
    ("Netflix", "Entertainment",
     1549, 799, 48,
     '["Active .edu email (select schools)", "Netflix student page"]', "edu_email",
     "https://www.netflix.com/in/loginAndSignup?locale=en-US", "US",
     "Note: Netflix's student discount is only available at select institutions. Check eligibility."),

    ("Paramount+", "Entertainment",
     799, 499, 38,
     '["UNiDAYS verification"]', "unidays",
     "https://www.paramountplus.com/",
     "US,UK",
     "Essential plan at reduced rate. Includes CBS content."),

    ("Peacock Premium", "Entertainment",
     599, 199, 67,
     '["Active .edu email", "Comcast/Xfinity or partner school"]', "edu_email",
     "https://www.peacocktv.com/plan/student",
     "US",
     "Ad-supported tier may be free, Premium discounted via select partners."),

    # ─── Software / Productivity ─────────────────────────────────────────────
    ("Microsoft 365 Personal", "Productivity",
     999, 0, 100,
     '["Active .edu email", "Microsoft Education verification"]', "edu_email",
     "https://www.microsoft.com/en-us/education/products/office", "Global",
     "Completely FREE for students at eligible institutions. Word, Excel, PowerPoint, Teams, OneDrive 1TB."),

    ("Notion", "Productivity",
     1600, 0, 100,
     '["Active .edu email"]', "edu_email",
     "https://www.notion.so/product/notion-for-education", "Global",
     "Notion Plus plan is FREE for students and educators. Unlimited blocks, AI add-on discounted."),

    ("Figma", "Productivity",
     1500, 0, 100,
     '["Active .edu email"]', "edu_email",
     "https://www.figma.com/education/", "Global",
     "Professional plan (normally $15/mo) is 100% FREE for students. FigJam Pro included."),

    ("Canva Pro", "Productivity",
     1299, 0, 100,
     '["Active .edu email"]', "edu_email",
     "https://www.canva.com/education/", "Global",
     "Canva for Education is FREE for students with .edu email. All Pro templates and features."),

    ("Grammarly Premium", "Productivity",
     3000, 1000, 67,
     '["Active .edu email", "Grammarly student plan"]', "edu_email",
     "https://www.grammarly.com/students", "US,CA,UK",
     "AI writing assistant. Plagiarism checker, tone detector. ~$10/mo on annual plan."),

    ("Evernote Personal", "Productivity",
     1499, 799, 47,
     '["SheerID student verification"]', "sheerid",
     "https://evernote.com/students", "US",
     "Note-taking app with sync across devices."),

    ("Todoist Pro", "Productivity",
     499, 299, 40,
     '["GitHub Student Pack or .edu email"]', "edu_email",
     "https://todoist.com/education", "Global",
     "Task management with advanced features."),

    # ─── Creative / Design ───────────────────────────────────────────────────
    ("Adobe Creative Cloud", "Productivity",
     5999, 1999, 67,
     '["Active .edu email", "Proof of enrollment"]', "edu_email",
     "https://www.adobe.com/creativecloud/buy/students.html", "US,CA,UK,AU",
     "Full Creative Cloud — Photoshop, Illustrator, Premiere, After Effects and 20+ apps. Best student deal in software."),

    ("Sketch", "Productivity",
     999, 499, 50,
     '["Active .edu email"]', "edu_email",
     "https://www.sketch.com/education/", "Global",
     "Mac-only design tool. Full license at 50% off."),

    ("InVision Studio", "Productivity",
     0, 0, 100,
     '["Active .edu email"]', "edu_email",
     "https://www.invisionapp.com/education-signup", "Global",
     "Prototyping and design collaboration. Free for students."),

    ("Affinity Designer", "Productivity",
     5499, 0, 100,
     '["Active .edu email or student ID"]', "edu_email",
     "https://store.affinity.serif.com/education/#buy",
     "Global",
     "One-time purchase — significant education discount available. No subscription."),

    # ─── Gaming ──────────────────────────────────────────────────────────────
    ("Xbox Game Pass Ultimate", "Gaming",
     1499, 499, 67,
     '["UNiDAYS verification"]', "unidays",
     "https://www.xbox.com/en-US/xbox-game-pass", "US,UK,CA,AU",
     "First 3 months at $1, then UNiDAYS deal. 100+ games, EA Play, Xbox Live included."),

    ("PlayStation Plus Essential", "Gaming",
     1099, 599, 45,
     '["UNiDAYS verification (select regions)"]', "unidays",
     "https://www.playstation.com/en-us/ps-plus/", "US,UK",
     "Online multiplayer + monthly games. Check UNiDAYS for current deal."),

    ("EA Play Pro", "Gaming",
     1499, 999, 33,
     '["Active .edu email via Origin"]', "edu_email",
     "https://www.ea.com/ea-play", "US,CA",
     "Access to EA's library on PC. Student discount via select programs."),

    ("Discord Nitro", "Entertainment",
     999, 499, 50,
     '["GitHub Student Developer Pack"]', "edu_email",
     "https://education.github.com/pack", "Global",
     "Available as part of GitHub Student Pack. Custom tags, boosting, bigger uploads."),

    # ─── Cloud Storage / Tools ───────────────────────────────────────────────
    ("Dropbox Plus", "Productivity",
     1199, 799, 33,
     '["Active .edu email"]', "edu_email",
     "https://www.dropbox.com/education", "US,CA",
     "2TB storage, advanced sharing + desktop sync. Education discount."),

    ("Dashlane Premium", "Productivity",
     399, 199, 50,
     '["SheerID student verification"]', "sheerid",
     "https://www.dashlane.com/personal-password-manager/premium", "US",
     "Password manager. Unlimited passwords, VPN, dark web monitoring."),

    ("1Password", "Productivity",
     299, 0, 100,
     '["Active .edu email — GitHub Student Pack"]', "edu_email",
     "https://education.github.com/pack", "Global",
     "Free via GitHub Student Developer Pack. Premium password manager."),

    # ─── VPN ─────────────────────────────────────────────────────────────────
    ("NordVPN", "Utilities",
     1499, 399, 73,
     '["UNiDAYS or SheerID verification"]', "unidays",
     "https://nordvpn.com/student-discount/", "Global",
     "2-year plan discounted to ~$3.99/mo. Best VPN for students."),

    ("ExpressVPN", "Utilities",
     1299, 799, 38,
     '["Student discount via comparison sites"]', "manual",
     "https://www.expressvpn.com/", "Global",
     "Check CouponFollow or RetailMeNot for current student codes."),

    ("Surfshark", "Utilities",
     1499, 249, 83,
     '["Student discount via UNiDAYS"]', "unidays",
     "https://surfshark.com/student-discount", "Global",
     "Unlimited devices. One of the cheapest VPNs with student discount."),

    # ─── Education / Learning ────────────────────────────────────────────────
    ("Chegg Study", "Education",
     1495, 995, 33,
     '["Active .edu email"]', "edu_email",
     "https://www.chegg.com/", "US",
     "Textbook solutions, expert Q&A, tutoring. Great for STEM courses."),

    ("Coursera Plus", "Education",
     5900, 3900, 34,
     '["Active .edu email at partner university"]', "edu_email",
     "https://www.coursera.org/courseraplus", "Global",
     "Unlimited access to 7,000+ courses. Many universities provide free access."),

    ("LinkedIn Learning", "Education",
     3999, 0, 100,
     '["Active .edu email"]', "edu_email",
     "https://www.linkedin.com/learning/", "Global",
     "FREE with many university library subscriptions. 16,000+ courses."),

    ("MasterClass", "Education",
     1500, 999, 33,
     '["UNiDAYS verification"]', "unidays",
     "https://www.masterclass.com/", "US,UK,CA,AU",
     "Celebrity-taught courses. Annual membership discounted."),

    ("Duolingo Super", "Education",
     1499, 799, 47,
     '["SheerID student verification"]', "sheerid",
     "https://www.duolingo.com/super", "US,CA",
     "Ad-free language learning, unlimited hearts, progress quizzes."),

    ("Rosetta Stone Lifetime", "Education",
     17999, 9999, 44,
     '["Active .edu email"]', "edu_email",
     "https://www.rosettastone.com/buyalifetime", "US",
     "Lifetime access to all 25 languages. Significant one-time discount."),

    ("Wolfram Alpha Pro", "Education",
     799, 399, 50,
     '["Active .edu email", "Wolfram student verification"]', "edu_email",
     "https://www.wolframalpha.com/pro/", "Global",
     "Step-by-step solutions, extended compute time. Essential for STEM."),

    # ─── Health & Fitness ────────────────────────────────────────────────────
    ("Headspace", "Health & Fitness",
     1299, 799, 38,
     '["SheerID student verification"]', "sheerid",
     "https://www.headspace.com/studentplan", "US,UK,CA,AU",
     "Meditation and sleep app. Student plan includes full access."),

    ("Calm Premium", "Health & Fitness",
     6999, 4999, 29,
     '["Active .edu email"]', "edu_email",
     "https://www.calm.com/signup", "US",
     "Annual plan. Sleep stories, meditation, breathing. Student discount via select schools."),

    ("Nike Training Club", "Health & Fitness",
     0, 0, 100,
     '["None — completely free"]', "manual",
     "https://www.nike.com/ntc-app", "Global",
     "Nike Training Club is completely FREE. 185+ guided workouts."),

    ("Planet Fitness", "Health & Fitness",
     2499, 1000, 60,
     '["Active .edu email at select campuses"]', "edu_email",
     "https://www.planetfitness.com/", "US",
     "Campus memberships available. Check local Planet Fitness."),

    # ─── News / Media ────────────────────────────────────────────────────────
    ("New York Times Digital", "News & Media",
     1700, 100, 94,
     '["Active .edu email"]', "edu_email",
     "https://www.nytimes.com/subscription/education", "US,Global",
     "NYT News + Cooking + Games for just $1/month with .edu email. Incredible value."),

    ("Wall Street Journal", "News & Media",
     3899, 499, 87,
     '["Active .edu email"]', "edu_email",
     "https://buy.wsj.com/shopandbuy/order/subscribe.sub?trackCode=aaqntaqhdtyy6xx", "US",
     "Full digital access for $4.99/month. Student rate verified with .edu."),

    ("The Washington Post", "News & Media",
     1000, 0, 100,
     '["Active .edu email"]', "edu_email",
     "https://subscribe.washingtonpost.com/studentoffers/", "US",
     "FREE digital subscription for students with .edu email. Full access."),

    ("Economist Digital", "News & Media",
     2200, 1200, 45,
     '["Active .edu email or NUS card"]', "edu_email",
     "https://www.economist.com/student/", "Global",
     "Full digital access plus weekly edition."),

    ("Wired Magazine", "News & Media",
     1999, 499, 75,
     '["Active .edu email"]', "edu_email",
     "https://www.wired.com/subscribe/", "US",
     "$4.99/year student subscription (vs $19.99/year standard). Huge savings on tech news!"),

    # ─── Food / Delivery ─────────────────────────────────────────────────────
    ("Grubhub+", "Food & Delivery",
     999, 0, 100,
     '["Active .edu email"]', "edu_email",
     "https://www.grubhub.com/help/contact-us", "US",
     "FREE Grubhub+ via Amazon Prime Student. Unlimited $0 delivery on orders $12+."),

    ("DoorDash DashPass", "Food & Delivery",
     999, 0, 100,
     '["Active .edu email — Amazon Prime Student"]', "edu_email",
     "https://www.doordash.com/dashpass/", "US,CA",
     "FREE via Amazon Prime Student. $0 delivery on orders $12+."),

    ("Instacart+", "Food & Delivery",
     999, 0, 100,
     '["Active .edu email"]', "edu_email",
     "https://www.instacart.com/", "US,CA",
     "Free Instacart+ via Amazon Prime Student. Grocery delivery."),

    # ─── Communication ───────────────────────────────────────────────────────
    ("Slack Pro", "Communication",
     750, 0, 100,
     '["Active .edu email — classroom use"]', "edu_email",
     "https://slack.com/intl/en-gb/help/articles/206646877-Slack-for-Education", "Global",
     "Pro features FREE for accredited schools and universities."),

    ("Zoom Pro", "Communication",
     1499, 0, 100,
     '["Active .edu email — Zoom for Education"]', "edu_email",
     "https://zoom.us/education", "Global",
     "Many universities provide Zoom Pro for free. Check your institution's IT portal."),

    ("Google Workspace (education)", "Communication",
     0, 0, 100,
     '["Active .edu email"]', "edu_email",
     "https://edu.google.com/", "Global",
     "Google Workspace for Education is FREE for all enrolled students. Gmail, Drive, Docs, Meet."),

    # ─── Finance / Other ─────────────────────────────────────────────────────
    ("Mint (Intuit)", "Finance",
     0, 0, 100,
     '["None — completely free"]', "manual",
     "https://mint.intuit.com/", "US,CA",
     "Budgeting app — completely free for everyone."),

    ("GitHub Pro", "Productivity",
     400, 0, 100,
     '["Active .edu email — GitHub Student Developer Pack"]', "edu_email",
     "https://education.github.com/pack", "Global",
     "GitHub Pro FREE + 100+ partner tools (JetBrains, Canva, 1Password, Namecheap, etc). Best dev student deal."),

    ("JetBrains All Products Pack", "Productivity",
     2490, 0, 100,
     '["Active .edu email — JetBrains Education"]', "edu_email",
     "https://www.jetbrains.com/student/", "Global",
     "ALL JetBrains IDEs (PyCharm, WebStorm, IntelliJ, DataGrip, etc) FREE for students."),

    ("AutoDesk Software Suite", "Productivity",
     33000, 0, 100,
     '["Active .edu email"]', "edu_email",
     "https://www.autodesk.com/education/edu-software/overview", "Global",
     "AutoCAD, Revit, Maya, Fusion 360 and more — FREE for 1 year, renewable. Must be enrolled."),

    ("Tableau Desktop", "Productivity",
     7000, 0, 100,
     '["Active .edu email"]', "edu_email",
     "https://www.tableau.com/academic/students", "Global",
     "Tableau Desktop and Tableau Prep Builder FREE for 1 year. Renewable while enrolled."),

    ("Namecheap .me domain", "Utilities",
     1499, 0, 100,
     '["Active .edu email — GitHub Student Pack"]', "edu_email",
     "https://education.github.com/pack", "Global",
     "Free .me domain for 1 year via GitHub Student Developer Pack."),

    ("LastPass Premium", "Productivity",
     300, 0, 100,
     '["Active .edu email"]', "edu_email",
     "https://www.lastpass.com/", "Global",
     "LastPass Premium FREE for students via their Education program."),
]


def seed():
    db = SessionLocal()
    try:
        existing = db.query(StudentDiscount).count()
        if existing > 0:
            print(f"⚠️  Table already has {existing} records. Checking for new entries...")

        added = 0
        skipped = 0

        for item in DISCOUNTS:
            (
                service_name, category,
                regular_cents, student_cents, discount_pct,
                requirements, verification_method,
                direct_link, availability, notes
            ) = item

            # Check duplicate by name
            exists = db.query(StudentDiscount).filter(
                StudentDiscount.service_name == service_name
            ).first()

            if exists:
                skipped += 1
                continue

            discount = StudentDiscount(
                service_name=service_name,
                category=category,
                regular_price_cents=regular_cents,
                student_price_cents=student_cents,
                discount_percentage=discount_pct,
                requirements=requirements,
                verification_method=verification_method,
                direct_link=direct_link,
                availability=availability,
                notes=notes,
                is_active=True,
            )
            db.add(discount)
            added += 1

        db.commit()
        print(f"✅ Done! Added {added} discounts, skipped {skipped} (already exist).")
        print(f"📊 Total in DB: {db.query(StudentDiscount).count()}")

    except Exception as e:
        db.rollback()
        import traceback
        print(f"❌ Error: {e}")
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
