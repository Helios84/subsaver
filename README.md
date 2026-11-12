<div align="center">

<img src="frontend/public/logo.svg" alt="SubSaver logo" width="80" height="80"/>

# SubSaver

A subscription tracker for students: see what you pay each month, split shared plans, get renewal reminders and look up student prices.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-subsaver--mu.vercel.app-7C3AED?style=for-the-badge&logo=vercel&logoColor=white)](https://subsaver-mu.vercel.app)
[![API Docs](https://img.shields.io/badge/API%20Docs-Swagger-0B0D0E?style=for-the-badge&logo=fastapi&logoColor=white)](https://subsaver-production.up.railway.app/docs)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)

</div>

---

## What is SubSaver?

SubSaver is a web app where you enter the subscriptions you pay for and see them in one dashboard: monthly and yearly spend, a 6-month trend, a category breakdown and upcoming renewals. It also includes a hand-maintained catalog of student prices for 60 services and matches it against your subscriptions by name.

Everything is entered by hand. SubSaver does not connect to a bank, a card, an email inbox or any subscription provider, and it does not cancel or pay for anything on your behalf.

This is a solo student portfolio project, not a commercial service.

---

## Features

### Subscriptions
- Add, edit, delete and duplicate subscriptions
- Monthly and yearly billing cycles
- Cost splitting: record how many people share a plan and track your own share
- Statuses: active, cancelled, trial, paused
- Search, filter and sort
- Export the list to CSV

### Student prices
- Catalog of 60 services with regular and student prices
- Subscriptions are matched to catalog entries by name
- `.edu` email verification by 6-digit code
- Applying a discount replaces the stored price with the catalog student price

### Dashboard
- Monthly spend, yearly projection and average per subscription
- 6-month spending trend that takes cancellation dates and cost splits into account
- Category breakdown chart
- Rule-based tips: renewals due this week, a category that dominates spending, plans that may be cheaper yearly
- Billing calendar

### Email
- Registration confirmation, password reset and student verification codes
- Daily renewal reminders a configurable number of days before a charge (APScheduler)

### Dashboard customization
- Drag-and-drop widget order (`@dnd-kit`), widget on/off and width
- Layout presets and density modes
- USD, EUR and GBP display using exchange rates cached on the server
- Undo and redo

### Security
- JWT authentication (HS256, 24-hour expiry) with server-side revocation on logout
- bcrypt password hashing
- Rate limits on auth endpoints (slowapi)
- Email confirmation required before first login
- Password required to delete an account

---

## Limitations

- All data is entered manually; nothing is imported from banks or providers.
- "Cancelled" is a status in your own list. The app does not cancel subscriptions with the provider.
- Catalog prices are maintained by hand and may be out of date.
- Spending trends are estimates from the data you entered, not a payment history.
- There are no automated tests yet.
- Database migrations require PostgreSQL.

---

## Tech Stack

### Frontend
| Technology | Version |
|---|---|
| Next.js (App Router) | 16.1.3 |
| React | 19.2.3 |
| TypeScript | ^5 |
| Tailwind CSS | ^4 |
| Recharts | ^3.6.0 |
| @dnd-kit | core ^6.3, sortable ^10 |
| Framer Motion | ^12.27 |
| Lucide React | ^0.562 |
| date-fns | ^4.1.0 |

### Backend
| Technology | Version |
|---|---|
| Python | 3.11 |
| FastAPI | 0.104.1 |
| SQLAlchemy | 2.0.23 |
| Alembic | 1.13.1 |
| Pydantic | 2.5.0 |
| python-jose (JWT) | 3.3.0 |
| bcrypt | 4.1.2 |
| APScheduler | 3.10.4 |
| slowapi | 0.1.9 |
| psycopg2 | 2.9.9 |
| httpx | 0.27.0 |

### Infrastructure
| Service | Role |
|---|---|
| Vercel | Frontend hosting |
| Railway | Backend hosting (Docker) |
| Neon | PostgreSQL |
| SMTP provider | Outgoing email |

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│               CLIENT (Vercel)                    │
│   Next.js 16 App Router  ·  React 19  ·  TS      │
│                                                  │
│  /           /dashboard   /customize  /settings  │
│  /login      /register    /verify-email          │
└─────────────────────┬────────────────────────────┘
                      │  HTTPS · JWT Bearer
                      │  (proxied through /backend_api)
┌─────────────────────▼────────────────────────────┐
│               BACKEND (Railway)                  │
│              FastAPI 0.104 · Python 3.11         │
│                                                  │
│  /auth/*    /subscriptions/*   /api/analytics/*  │
│  /api/student-discounts/*      /api/dashboard/*  │
│  /users/me  /reminders/*       /health           │
│                                                  │
│   ┌──────────┐  ┌────────────┐  ┌────────────┐   │
│   │   JWT    │  │ Scheduler  │  │   Email    │   │
│   │   Auth   │  │(APScheduler)│ │  Service   │   │
│   └──────────┘  └────────────┘  └────────────┘   │
└─────────────────────┬────────────────────────────┘
                      │  SQLAlchemy ORM
┌─────────────────────▼────────────────────────────┐
│              DATABASE (Neon)                     │
│                PostgreSQL                        │
│                                                  │
│   users ◄──── subscriptions     revoked_tokens   │
│                                                  │
│           student_discounts                      │
└──────────────────────────────────────────────────┘
```

---

## Project Structure

```
subsaver/
├── backend/
│   ├── core/               # Password hashing and JWT helpers
│   ├── migrations/         # Alembic migrations
│   ├── models/             # SQLAlchemy models
│   ├── routers/            # FastAPI route handlers
│   ├── schemas/            # Pydantic request/response schemas
│   ├── services/           # Email, reminders, scheduler
│   ├── scripts/
│   │   └── seed_discounts.py  # Seeds the 60-service discount catalog
│   ├── templates/          # HTML email template
│   ├── config.py           # Settings read from environment variables
│   ├── database.py         # SQLAlchemy engine and session
│   ├── dependencies.py     # Shared FastAPI dependencies
│   ├── main.py             # App entry point
│   ├── Dockerfile
│   └── requirements.txt
│
└── frontend/
    └── app/
        ├── components/     # UI components
        ├── dashboard/      # Main dashboard page
        ├── customize/      # Dashboard customization
        ├── settings/       # Account settings
        ├── login/  register/  verify-email/
        ├── privacy/  terms/
        ├── lib/            # API client, currency, categories
        ├── types/          # TypeScript types
        └── page.tsx        # Landing page
```

---

## Local Development

### Prerequisites
- Python 3.11 or 3.12
- Node.js 20+
- PostgreSQL (a free [Neon](https://neon.tech) database works)

### 1. Backend

```bash
cd backend

python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Create backend/.env with the variables listed below, then:
alembic upgrade head
python scripts/seed_discounts.py
uvicorn main:app --reload --port 8000
```

- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
echo "BACKEND_URL=http://localhost:8000" > .env.local
npm run dev
```

- App: http://localhost:3000

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | yes | none | Long random string used to sign tokens |
| `DATABASE_URL` | yes | `sqlite:///./subsaver.db` | PostgreSQL connection string |
| `ALLOWED_ORIGINS` | yes | `http://localhost:3000` | Comma-separated CORS origins |
| `FRONTEND_URL` | yes | `http://localhost:3000` | Base URL used for links in emails |
| `ENVIRONMENT` | no | `production` | `development` or `production`. Verification codes are written to the log only in `development` |
| `TRUSTED_PROXY_COUNT` | no | `0` | Number of reverse proxies in front of the API; used to read the client IP for rate limiting from `X-Forwarded-For` |
| `SMTP_HOST` | no | empty | SMTP host |
| `SMTP_PORT` | no | `2525` | SMTP port |
| `SMTP_USER` | no | empty | SMTP username |
| `SMTP_PASSWORD` | no | empty | SMTP password |
| `SMTP_FROM_EMAIL` | no | `noreply@subsaver.example` | Sender address |
| `SMTP_FROM_NAME` | no | `SubSaver` | Sender name |

The server starts without SMTP settings; emails are then skipped and a warning is logged.

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | yes | Backend URL used by the Next.js proxy |
| `NEXT_PUBLIC_SITE_URL` | no | Public URL of the site, used for Open Graph links |
| `NEXT_PUBLIC_CONTACT_EMAIL` | no | Contact address; contact links are hidden when unset |

---

## Deployment

### Railway (backend)

1. Create a Railway project from the GitHub repo.
2. Set **Root Directory** to `backend`. Railway builds the `Dockerfile`.
3. Add the backend environment variables.
4. On start the container runs migrations, seeds the catalog and starts Uvicorn.

### Vercel (frontend)

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `frontend`.
3. Add `BACKEND_URL` (the Railway URL) and, optionally, the `NEXT_PUBLIC_*` variables.

---

## API Reference

Interactive docs are served at `/docs` on any running backend.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register; sends a 6-digit email code |
| `POST` | `/auth/confirm-email` | Confirm the email with the code |
| `POST` | `/auth/login` | Log in and receive a JWT |
| `POST` | `/auth/logout` | Revoke the current token |
| `POST` | `/auth/forgot-password` | Request a password reset code |
| `POST` | `/auth/reset-password` | Set a new password with the code |
| `POST` | `/auth/verify-edu` | Request a `.edu` verification code |
| `POST` | `/auth/verify-edu/confirm` | Confirm student status |
| `GET` | `/users/me` | Current user profile |
| `DELETE` | `/users/me` | Delete the account (password required) |

### Subscriptions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/subscriptions` | List subscriptions |
| `POST` | `/subscriptions` | Create a subscription |
| `PATCH` | `/subscriptions/{id}` | Update a subscription |
| `DELETE` | `/subscriptions/{id}` | Delete a subscription |

### Dashboard and analytics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Subscriptions, trends, breakdown and tips in one response |
| `GET` | `/api/analytics/trends` | 6-month trend and category breakdown |
| `GET` | `/api/analytics/insights` | Rule-based tips |
| `GET` | `/api/rates` | Cached exchange rates |

### Student discounts
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/student-discounts` | The discount catalog (public) |
| `POST` | `/api/student-discounts/batch-check` | Match several subscriptions against the catalog |
| `POST` | `/api/student-discounts/apply/{id}` | Apply the student price to a subscription |
| `GET` | `/api/student-discounts/savings` | Savings summary |

### System
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |

---

## Project Timeline

Developed between December 2025 and May 2026.

| Period | Milestone |
|---|---|
| Jan 2026 | Next.js and FastAPI scaffolding, auth, subscription CRUD, email reminders |
| Feb 2026 | Student discount catalog, service picker, student verification, dashboard redesign |
| Mar 2026 | Dashboard customization with drag-and-drop widgets, bcrypt and rate limiting |
| Apr 2026 | PostgreSQL on Neon with Alembic migrations, deployment to Vercel and Railway, mobile layout |
| May 2026 | Token revocation, single dashboard summary endpoint, server-side exchange-rate cache |

---

## License

MIT. See [LICENSE](LICENSE).

Author: Victor Lavrentyev ([Helios84](https://github.com/Helios84))
