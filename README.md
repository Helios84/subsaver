# SubSaver 🎓💰

> The #1 subscription management platform for students. Track, optimize, and save on your subscriptions.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)

## ✨ Features

- 📊 **Subscription Tracking** — Add, edit, and manage all your subscriptions in one place
- 🎓 **Student Discounts** — Browse 60+ verified student discounts with savings calculator
- 💰 **Savings Analytics** — Interactive charts, spending trends, and AI-like insights
- 🔔 **Renewal Reminders** — Automated email alerts before subscriptions renew
- 💱 **Currency Conversion** — Real-time USD/EUR/GBP conversion
- 👥 **Cost Splitting** — Track shared subscriptions with friends
- 🎨 **Customizable Dashboard** — Drag-and-drop widgets with multiple layouts
- 🔒 **Student Verification** — Verify your .edu email to unlock exclusive discounts

## 🏗 Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Next.js 16     │────▶│    FastAPI        │────▶│  PostgreSQL  │
│   (Frontend)     │     │    (Backend)      │     │  (Database)  │
│   Port: 3000     │     │    Port: 8000     │     │              │
└──────────────────┘     └──────────────────┘     └──────────────┘
         │                        │
    API Proxy               APScheduler
  /backend_api/*          (Daily 9AM cron)
```

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Python** 3.11+
- **Node.js** 18+
- **Git**

### 1. Clone the repository

```bash
git clone https://github.com/your-username/subsaver.git
cd subsaver
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate     # Windows
# source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your values (see Environment Variables section below)

# Run database migrations
alembic upgrade head

# Seed student discounts (60+ services)
python scripts/seed_discounts.py

# Start the server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Environment Variables

Create a `backend/.env` file (see `backend/.env.example` for template):

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | ✅ | Secret key for JWT tokens. Generate with: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_URL` | ✅ | Database connection string. `sqlite:///./subsaver.db` (dev) or `postgresql://...` (prod) |
| `FRONTEND_URL` | ✅ | Frontend URL. `http://localhost:3000` (dev) or production domain |
| `ALLOWED_ORIGINS` | ✅ | CORS origins. `http://localhost:3000` (dev) or production domain |
| `SMTP_HOST` | ❌ | SMTP server hostname (e.g., `sandbox.smtp.mailtrap.io`) |
| `SMTP_PORT` | ❌ | SMTP port (e.g., `2525` for Mailtrap, `587` for production) |
| `SMTP_USER` | ❌ | SMTP username |
| `SMTP_PASSWORD` | ❌ | SMTP password |
| `SMTP_FROM_EMAIL` | ❌ | Sender email address |
| `SMTP_FROM_NAME` | ❌ | Sender display name |

> **Note:** SMTP is optional for development. Without it, verification codes are logged to the console.

## 🌐 Deploy (Free Tier)

### Frontend → Vercel

1. Push your code to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Add environment variable: `BACKEND_URL=https://your-backend.railway.app`
5. Deploy!

### Backend → Railway

1. Create a project at [railway.app](https://railway.app)
2. Deploy from GitHub → select the `backend` folder
3. Add all environment variables from `.env.example`
4. Railway will auto-detect the `Procfile` or start with `uvicorn`

### Database → Neon

1. Create a database at [neon.tech](https://neon.tech)
2. Copy the `DATABASE_URL` (with `?sslmode=require`)
3. Add it to your Railway environment variables
4. Run migrations: `alembic upgrade head`

> **🎓 Tip:** Use [GitHub Student Pack](https://education.github.com/pack) for free Railway credits and more!

## 📁 Project Structure

```
subsaver/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Environment configuration
│   ├── database.py          # SQLAlchemy setup
│   ├── core/security.py     # Password hashing & JWT
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── routers/             # API route handlers
│   ├── services/            # Business logic layer
│   └── migrations/          # Alembic database migrations
│
└── frontend/
    ├── app/                 # Next.js App Router pages
    │   ├── components/      # Reusable UI components
    │   ├── lib/             # Utilities (API client, currency, categories)
    │   ├── types/           # TypeScript interfaces
    │   ├── dashboard/       # Main dashboard page
    │   ├── settings/        # User settings page
    │   └── globals.css      # Design system ("Liquid Mirror")
    └── public/              # Static assets
```

## 🔑 API Overview

**33 endpoints** across 5 routers:

| Router | Prefix | Endpoints | Description |
|--------|--------|-----------|-------------|
| Auth | `/auth` | 12 | Registration, login, email verification, password reset |
| Subscriptions | `/subscriptions` | 4 | CRUD for user subscriptions |
| Reminders | `/reminders` | 4 | Reminder settings and triggers |
| Student Discounts | `/api/student-discounts` | 6 | Discount browsing, checking, applying |
| Analytics | `/api/analytics` | 2 | Spending trends and insights |

**Interactive API docs:** `http://localhost:8000/docs` (Swagger UI)

## 🎨 Design System

The frontend uses a custom **"Liquid Mirror"** design system:

- **Theme:** Dark mode with violet/fuchsia gradient accents
- **Effects:** Glassmorphism, aurora backgrounds, shimmer loading
- **Typography:** Inter (body) + Syne (headings) from Google Fonts
- **Animations:** 15+ keyframe animations for micro-interactions
- **Components:** Cards, buttons, badges, inputs — all with glass effects

## 📄 License

This project is for educational/portfolio purposes.

---

Built with 💜 for students, by students.
