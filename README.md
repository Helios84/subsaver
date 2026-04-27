# SubSaver (SubSaver)

> Smart subscription tracking and student discount platform.

**Live:** [subsaver-mu.vercel.app](https://subsaver-mu.vercel.app)  
**API:** [subsaver-production.up.railway.app](https://subsaver-production.up.railway.app)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | FastAPI, SQLAlchemy 2, Pydantic 2, Alembic |
| Database | PostgreSQL (Neon) |
| Auth | JWT, bcrypt |
| Email | SMTP (Mailtrap sandbox / any SMTP) |
| Scheduler | APScheduler |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 20+

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
cp .env.example .env            # Fill in your values

alembic upgrade head            # Apply DB migrations
python scripts/seed_discounts.py  # Seed student discounts

uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
Swagger docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install

# Create .env.local with:
# BACKEND_URL=http://localhost:8000

npm run dev
```

Frontend runs at: http://localhost:3000

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | Long random secret (64+ chars) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated CORS origins |
| `FRONTEND_URL` | ✅ | Frontend URL for email links |
| `ENVIRONMENT` | — | `development` or `production` |
| `SMTP_HOST` | — | SMTP host (Mailtrap, SendGrid...) |
| `SMTP_PORT` | — | SMTP port (default: 2525) |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASSWORD` | — | SMTP password |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | ✅ | Backend URL for Next.js proxy |

---

## Deployment

### Railway (Backend)
- Root Directory: `backend`
- Start command (via Procfile): `alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT`
- Set all backend env vars in Railway Dashboard → Variables

### Vercel (Frontend)
- Root Directory: `frontend`
- Set `BACKEND_URL=https://subsaver-production.up.railway.app` in Vercel Dashboard → Settings → Environment Variables

### Seed Database (one-time)
Run in Railway Dashboard → Shell:
```bash
python scripts/seed_discounts.py
```

---

## API

Full API available at `/docs` on the running backend.

Health check: `GET /health`
