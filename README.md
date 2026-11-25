<div align="center">

<img src="frontend/public/logo.svg" alt="SubSaver logo" width="72" height="72"/>

# SubSaver

A subscription tracker for students: enter what you pay for and see the monthly total, your share of split plans, and what renews next.

**[Live demo: subsaver-mu.vercel.app](https://subsaver-mu.vercel.app)**
Click **Try the demo** on the home page. It opens a temporary account with sample data; no sign-up or password is needed.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://neon.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<img src="docs/screenshots/dashboard.png" alt="The SubSaver dashboard with sample data: monthly spend, spending trend, category breakdown, tips and upcoming renewals" width="900"/>

</div>

---

## What it is

SubSaver is a web app where you enter your subscriptions by hand and see them in one dashboard. It also includes a hand-maintained catalog of student prices for 60 services and matches it against your subscriptions by name.

It does not connect to a bank, a card, an email inbox or any subscription provider, and it does not cancel or pay for anything on your behalf.

This is a solo student portfolio project, not a commercial service.

## Features

**Subscriptions**
- Add, edit, duplicate and delete subscriptions; monthly and yearly billing
- Cost splitting: record how many people share a plan and track only your share
- Statuses (active, cancelled, trial, paused); search, filter, sort; CSV export

**Dashboard**
- Monthly spend, yearly projection and average per subscription
- Six-month spending trend that takes cancellation dates and cost splits into account
- Category breakdown, upcoming renewals and a billing calendar
- Rule-based tips: renewals due this week, a category that dominates spending, monthly plans worth comparing with a yearly price
- Drag-and-drop widget order, widget on/off and width, layout presets; USD, EUR or GBP display

**Student prices**
- Catalog of 60 services with regular and student prices, matched to your subscriptions by name
- `.edu` email verification by a 6-digit code sent to that address

**Accounts and email**
- Registration with email confirmation, password reset by code
- JWT authentication with server-side revocation on logout, bcrypt password hashing, per-client rate limits
- Optional renewal reminder emails a chosen number of days before a charge

**Demo**
- "Try the demo" creates a private temporary account with ten sample subscriptions
- Demo accounts are deleted after 24 hours by an hourly job and cannot change account settings

## Screenshots

| Landing page | Adding a subscription |
|:---:|:---:|
| <img src="docs/screenshots/landing.png" alt="Landing page with the headline, the demo button and a product screenshot" width="430"/> | <img src="docs/screenshots/add-subscription.png" alt="Service picker with search and a list of services" width="430"/> |

| Editing a subscription | Dashboard on a phone |
|:---:|:---:|
| <img src="docs/screenshots/edit-subscription.png" alt="Edit dialog with price, billing cycle, status, category and cost splitting" width="430"/> | <img src="docs/screenshots/dashboard-mobile.png" alt="Dashboard at phone width" width="210"/> |

All screenshots show the demo account with sample data.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Recharts, @dnd-kit |
| Backend | Python 3.11, FastAPI 0.104, SQLAlchemy 2.0, Alembic, Pydantic 2, APScheduler, slowapi |
| Auth | python-jose (JWT, HS256), bcrypt |
| Database | PostgreSQL (Neon) |
| Hosting | Vercel (frontend), Railway (backend, Docker) |
| Email | SMTP |

## Architecture

```mermaid
flowchart LR
    U[Browser] -->|HTTPS| FE["Next.js app<br/>(Vercel)"]
    FE -->|"/backend_api/* proxy<br/>JWT bearer token"| API["FastAPI<br/>(Railway, Docker)"]
    API -->|SQLAlchemy| DB[("PostgreSQL<br/>(Neon)")]
    API -->|SMTP| MAIL[Email provider]
    API -->|"cached 1 h"| FX[open.er-api.com<br/>exchange rates]

    subgraph Backend process
        API
        SCH["APScheduler<br/>daily: renewal reminders, token cleanup<br/>hourly: demo account cleanup"]
    end
    SCH --> DB
    SCH --> MAIL
```

- The browser only talks to the Next.js app. `next.config.ts` proxies `/backend_api/*` to the API, so there are no cross-origin calls.
- The scheduler runs inside the API process, so the backend is meant to run as a single instance.
- Schema changes are Alembic migrations, applied automatically when the container starts.

## Project structure

```
subsaver/
├── backend/
│   ├── core/           # Password hashing and JWT helpers
│   ├── migrations/     # Alembic migrations
│   ├── models/         # SQLAlchemy models
│   ├── routers/        # FastAPI route handlers
│   ├── schemas/        # Pydantic request/response schemas
│   ├── services/       # Email, reminders, scheduler, demo accounts
│   ├── scripts/        # seed_discounts.py: seeds the discount catalog
│   ├── config.py       # Settings read from environment variables
│   └── main.py         # App entry point
├── frontend/
│   ├── app/            # Pages, components, lib (API client, money and currency helpers)
│   └── public/         # Logo and landing-page screenshots
└── docs/screenshots/   # Images used in this README
```

## Run locally

Prerequisites: Python 3.11 or 3.12, Node.js 20+, and a PostgreSQL database (a free [Neon](https://neon.tech) database works; the migrations are PostgreSQL-only).

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

Create `backend/.env`:

```
JWT_SECRET=<a long random string>
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>
ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
DEMO_ENABLED=true
```

Then:

```bash
alembic upgrade head
python scripts/seed_discounts.py
uvicorn main:app --reload --port 8000
```

The API runs at http://localhost:8000 and the interactive docs at http://localhost:8000/docs.
Without SMTP settings no email is sent; in `development` the confirmation codes are written to the server log instead.

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_DEMO_ENABLED=true
```

Then `npm run dev` and open http://localhost:3000.

### Environment variables

| Backend variable | Default | Purpose |
|---|---|---|
| `JWT_SECRET` | none (required) | Signs access tokens |
| `DATABASE_URL` | `sqlite:///./subsaver.db` | PostgreSQL connection string |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |
| `FRONTEND_URL` | `http://localhost:3000` | Base URL for links in emails |
| `ENVIRONMENT` | `production` | `development` logs verification codes when email is off |
| `TRUSTED_PROXY_COUNT` | `0` | Reverse proxies in front of the API, used to find the client IP for rate limits |
| `DEMO_ENABLED` | `false` | Enables `POST /auth/demo-login` |
| `DEMO_MAX_USERS` | `500` | Cap on live demo accounts |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | empty | Outgoing email |
| `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME` | `noreply@subsaver.example`, `SubSaver` | Sender |

| Frontend variable | Purpose |
|---|---|
| `BACKEND_URL` | Backend URL used by the proxy (required) |
| `NEXT_PUBLIC_DEMO_ENABLED` | `true` shows the "Try the demo" button |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for link previews |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact address; contact links are hidden when unset |

## Tests

There is no automated test suite yet. What can be run today:

```bash
cd frontend
npx tsc --noEmit    # type check
npm run build       # production build
npm run lint        # ESLint (reports existing issues)
```

A backend test suite and CI are on the roadmap below.

## API

Interactive documentation is served at `/docs` on a running backend ([live API docs](https://subsaver-production.up.railway.app/docs)). Main groups:

| Group | Endpoints |
|---|---|
| Auth | `/auth/register`, `/auth/confirm-email`, `/auth/login`, `/auth/logout`, `/auth/demo-login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-edu` |
| Account | `/users/me`, `/users/me/preferences`, `/reminders/settings` |
| Subscriptions | `/subscriptions`, `/subscriptions/{id}` |
| Dashboard | `/api/dashboard/summary`, `/api/analytics/trends`, `/api/analytics/insights`, `/api/rates` |
| Student prices | `/api/student-discounts`, `/api/student-discounts/batch-check`, `/api/student-discounts/apply/{id}`, `/api/student-discounts/savings` |

## Limitations

- Everything is entered by hand. Nothing is imported from banks or providers.
- "Cancelled" is a status in your own list; the app does not cancel anything with the provider.
- Catalog prices are maintained by hand and have not been checked against current provider pricing.
- The savings figures use catalog prices rather than the price you entered.
- Spending trends are estimates from the data you entered, not a payment history.
- There are no automated tests yet.
- Migrations run only on PostgreSQL.
- Rate limits can be bypassed by calling the API host directly instead of going through the site.

## Roadmap

- Savings based on the user's own price, and realized savings from cancelled subscriptions
- A reviewed discount catalog with a source link and a "checked on" date for each entry
- Backend tests (pytest) and CI on every push
- A committed `.env.example` and a database setup that works from a fresh clone
- Lint clean-up (replace `any` types)

## Timeline

Developed between December 2025 and May 2026, with a clean-up pass in November 2026.

## License

MIT. See [LICENSE](LICENSE).

Author: Victor Lavrentyev ([Helios84](https://github.com/Helios84))
