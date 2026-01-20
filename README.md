# 🎯 SubSaver - Smart Subscription Management Platform

**SubSaver** is a modern full-stack web application designed to help users track, analyze, and manage their online subscriptions. Save money, eliminate subscription fatigue, and take control of your recurring expenses.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-009688)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB)](https://react.dev/)

---

## ✨ Features

### 📊 Analytics Dashboard
- **8 Interactive Charts** powered by Recharts:
  - Top Expenses (Bar Chart)
  - Billing Distribution (Pie Chart)
  - Category Breakdown (Pie Chart)
  - Savings Tracker (Bar Chart)
  - Upcoming Renewals Calendar
  - Monthly Spending Trend (Area Chart)
  - Price Distribution Histogram
  - Average Cost per Category (Horizontal Bar)
- **4 Key Metrics Cards**:
  - Total Monthly Spend
  - Active Subscriptions Count
  - Yearly Projection
  - Average per Subscription

### 💳 Subscription Management
- **Full CRUD Operations**: Create, Read, Update, Delete subscriptions
- **Rich Metadata**:
  - Name, Price, Billing Cycle (Monthly/Yearly)
  - Status (Active/Cancelled)
  - Categories (Entertainment, Gaming, Productivity, Education, Health, Shopping, Other)
  - Next Billing Date tracking
- **Inline Editing**: Edit subscriptions directly in the dashboard
- **Savings Calculation**: Track money saved from cancelled subscriptions

### 🔔 Smart Reminders
- **Email Notifications**: Automated reminders before subscription renewals
- **Customizable Settings**: Choose reminder timing (3, 7, or 14 days before)
- **Scheduled Jobs**: APScheduler runs daily at 9:00 AM
- **HTML Email Templates**: Beautiful, responsive email design
- **Manual Testing**: Send test emails to verify configuration

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for secure password storage
- **Protected Routes**: Frontend and backend route protection
- **CORS Configuration**: Secure cross-origin requests
- **Environment Variables**: Sensitive data stored in `.env` files

### 🎨 Modern UI/UX
- **Glassmorphism Design**: Premium glass-effect cards and panels
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Polished transitions and interactions
- **Color-Coded Categories**: Visual distinction for different subscription types
- **Dark Theme**: Elegant dark color scheme with vibrant accents

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) 0.115.6
- **Database**: SQLite with [SQLAlchemy](https://www.sqlalchemy.org/) ORM
- **Authentication**: JWT tokens with [python-jose](https://github.com/mpdavis/python-jose)
- **Password Hashing**: [passlib](https://passlib.readthedocs.io/) with bcrypt
- **Scheduling**: [APScheduler](https://apscheduler.readthedocs.io/) for background tasks
- **Email**: SMTP with [Jinja2](https://jinja.palletsprojects.com/) templates
- **Validation**: [Pydantic](https://docs.pydantic.dev/) models

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) 16.1.3 with Turbopack
- **UI Library**: [React](https://react.dev/) 19.2.3
- **Styling**: [TailwindCSS](https://tailwindcss.com/) 4.0.0
- **Charts**: [Recharts](https://recharts.org/) 2.15.0
- **Icons**: [Lucide React](https://lucide.dev/) 0.468.0
- **Language**: TypeScript

---

## 📁 Project Structure

```
subsaver/
├── backend/
│   ├── main.py                    # FastAPI app, models, auth endpoints
│   ├── dependencies.py            # Shared dependencies (DB, auth)
│   ├── routers/
│   │   └── reminders.py          # Reminder settings & endpoints
│   ├── services/
│   │   ├── email_service.py      # SMTP email sending
│   │   ├── reminder_service.py   # Reminder business logic
│   │   └── scheduler.py          # APScheduler configuration
│   ├── requirements.txt          # Python dependencies
│   ├── .env                      # Environment variables (not committed)
│   └── subsaver.db              # SQLite database (not committed)
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles & design system
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Main dashboard with charts
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   ├── register/
│   │   │   └── page.tsx          # Registration page
│   │   ├── settings/
│   │   │   └── page.tsx          # Reminder settings page
│   │   └── lib/
│   │       └── api.ts            # API client with JWT handling
│   ├── package.json              # Node dependencies
│   ├── tailwind.config.ts        # TailwindCSS configuration
│   └── .env.local               # Frontend env vars (not committed)
│
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites
- **Python** 3.11 or higher
- **Node.js** 18 or higher
- **npm** or **yarn**

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv .venv
   ```

3. **Activate virtual environment**:
   - Windows: `.venv\Scripts\activate`
   - macOS/Linux: `source .venv/bin/activate`

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Create `.env` file** in `backend/` directory:
   ```env
   JWT_SECRET=your-super-secret-key-change-this-in-production
   JWT_ALG=HS256
   JWT_EXPIRES_MIN=43200
   DATABASE_URL=sqlite:///./subsaver.db
   
   # SMTP Configuration (for email reminders)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM_EMAIL=your-email@gmail.com
   SMTP_FROM_NAME=SubSaver
   ```

6. **Run the backend**:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

   Backend will be available at: `http://127.0.0.1:8000`
   - API Docs (Swagger): `http://127.0.0.1:8000/docs`
   - Alternative Docs (ReDoc): `http://127.0.0.1:8000/redoc`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env.local` file** in `frontend/` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

   Frontend will be available at: `http://localhost:3000`

---

## 📖 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response:
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

### Subscription Endpoints (Protected)

All subscription endpoints require `Authorization: Bearer <token>` header.

#### Get All Subscriptions
```http
GET /subscriptions
Authorization: Bearer <token>
```

#### Create Subscription
```http
POST /subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Netflix",
  "price_cents": 1599,
  "billing_cycle": "monthly",
  "status": "active",
  "category": "Entertainment",
  "next_billing_date": "2026-02-15T00:00:00Z"
}
```

#### Update Subscription
```http
PATCH /subscriptions/{sub_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "price_cents": 1799,
  "category": "Entertainment"
}
```

#### Delete Subscription
```http
DELETE /subscriptions/{sub_id}
Authorization: Bearer <token>
```

### Reminder Endpoints (Protected)

#### Get Reminder Settings
```http
GET /reminders/settings
Authorization: Bearer <token>
```

#### Update Reminder Settings
```http
PATCH /reminders/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "reminder_enabled": true,
  "reminder_days_before": 7
}
```

#### Get Upcoming Renewals
```http
GET /reminders/upcoming
Authorization: Bearer <token>
```

#### Send Test Email
```http
POST /reminders/test-email
Authorization: Bearer <token>
```

---

## 🗄️ Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `email` | String | Unique user email |
| `password_hash` | String | Bcrypt hashed password |
| `created_at` | DateTime | Account creation timestamp |
| `reminder_enabled` | Boolean | Email reminders enabled (default: true) |
| `reminder_days_before` | Integer | Days before renewal to send reminder (3, 7, or 14) |

### Subscriptions Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `user_id` | Integer | Foreign key to users |
| `name` | String | Subscription name |
| `price_cents` | Integer | Price in cents |
| `billing_cycle` | String | "monthly" or "yearly" |
| `status` | String | "active" or "cancelled" |
| `category` | String | Subscription category |
| `created_at` | DateTime | Creation timestamp |
| `next_billing_date` | DateTime | Next renewal date (nullable) |
| `reminder_sent` | Boolean | Reminder email sent flag |
| `last_reminder_date` | DateTime | Last reminder timestamp |

---

## 🎨 Design System

### Color Palette
- **Primary**: Red (#DC2626) - Monthly spend, alerts
- **Secondary**: Blue (#3B82F6) - Active subscriptions, trends
- **Success**: Green (#10B981) - Savings, positive metrics
- **Warning**: Orange (#F59E0B) - Upcoming renewals
- **Info**: Purple (#8B5CF6) - Average metrics
- **Background**: Dark gradient (#0A0A0A → #1A1A1A)

### Typography
- **Font Family**: System fonts (SF Pro, Segoe UI, Roboto)
- **Headings**: Bold, tracking-tight
- **Body**: Regular, readable line-height

### Components
- **Glass Cards**: Backdrop blur with subtle borders
- **Gradient Backgrounds**: Mesh gradients for depth
- **Smooth Transitions**: 200-300ms ease-in-out
- **Responsive Grids**: Mobile-first approach

---

## 🔒 Security Best Practices

### Implemented
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Environment variables for secrets
- ✅ CORS configuration
- ✅ Protected API routes
- ✅ Input validation with Pydantic
- ✅ `.gitignore` for sensitive files

### Recommended for Production
- [ ] Rate limiting (FastAPI Limiter)
- [ ] HTTPS/SSL certificates
- [ ] PostgreSQL instead of SQLite
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] CSRF protection
- [ ] Security headers (Helmet.js)
- [ ] Regular dependency updates

---

## 📧 Email Configuration

### Gmail Setup (Recommended)
1. Enable 2-Step Verification in your Google Account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the 16-character password
3. Use the app password in `SMTP_PASSWORD` in `.env`

### Other SMTP Providers
- **Outlook**: `smtp.office365.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`

---

## 🧪 Testing

### Manual Testing
1. **Register a new user** at `/register`
2. **Login** at `/login`
3. **Add subscriptions** on the dashboard
4. **Edit subscription** categories and dates
5. **View analytics** - all 8 charts should populate
6. **Configure reminders** at `/settings`
7. **Send test email** to verify SMTP

### API Testing
Use the Swagger UI at `http://127.0.0.1:8000/docs` to test all endpoints interactively.

---

## 🚧 Roadmap

### ✅ Completed (Month 1-2)
- [x] User authentication (JWT)
- [x] Subscription CRUD operations
- [x] Dashboard with 8 charts
- [x] Email reminder system
- [x] Scheduled background jobs
- [x] Category management
- [x] Savings tracking
- [x] Responsive UI design

### 🔄 In Progress (Month 2)
- [ ] Email cancellation automation
- [ ] Advanced dashboard filters
- [ ] Export data (CSV/PDF)

### 📅 Planned (Month 3-4)
- [ ] CSV import for bank transactions
- [ ] Transaction analysis module
- [ ] Recurring payment detection
- [ ] Plaid/Finicity integration
- [ ] PostgreSQL migration
- [ ] Automated testing (pytest, Jest)
- [ ] CI/CD pipeline (GitHub Actions)

### 🎯 Future Enhancements (Month 5+)
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] AI-powered subscription recommendations
- [ ] Shared family accounts
- [ ] Budget vs actual tracking
- [ ] Multi-currency support
- [ ] Dark/light theme toggle

---

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests for improvements
- Share your experience using SubSaver

---

## 📄 License

This project is for educational and personal use.

---

## 🙏 Acknowledgments

- **FastAPI** - Modern Python web framework
- **Next.js** - React framework for production
- **Recharts** - Composable charting library
- **TailwindCSS** - Utility-first CSS framework
- **Lucide** - Beautiful icon library

---

## 📞 Support

For questions or issues:
- Check the [API Documentation](http://127.0.0.1:8000/docs)
- Review this README
- Check the code comments

---

**Built with ❤️ for better subscription management**