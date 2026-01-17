# subsaver
The application will not start if JWT_SECRET is not set. This is intentional for security reasons.

# SubSaver

A minimal full-stack app to track subscriptions.  
Tech: FastAPI + SQLite + JWT (backend) and Next.js (frontend).

---

## What we added (latest changes)

### Backend (FastAPI)
- **SQLite database** (`subsaver.db`) with SQLAlchemy models:
  - `users` (email + password hash)
  - `subscriptions` (name, price_cents, billing_cycle, status)
- **Secure password hashing** using `passlib` + `bcrypt`
- **JWT authentication**
  - Token creation with expiration
  - Protected endpoints via `Authorization: Bearer <token>`
- **Auth endpoints**
  - `POST /auth/register` (JSON)
  - `POST /auth/login` (JSON) → returns `access_token`
  - `POST /auth/token` (OAuth2 password flow for Swagger Authorize)
- **Subscriptions CRUD** (protected)
  - `GET /subscriptions`
  - `POST /subscriptions`
  - `PATCH /subscriptions/{sub_id}`
  - `DELETE /subscriptions/{sub_id}`
- **CORS** enabled for local frontend dev
- **JWT secret moved to `.env`** (not committed)

### Frontend (Next.js)
- Pages:
  - `/register` (register user)
  - `/login` (login, save token)
  - `/dashboard` (shows token, basic navigation)

---