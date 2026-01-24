# 🎯 SubSaver Student Edition

**[English](#english) | [Русский](#russian)**

---

<a name="english"></a>
## 🇬🇧 English

**SubSaver Student Edition** is the ultimate subscription management platform tailored for students. It helps you track expenses, discover educational discounts, and save money on recurring services like Spotify, Prime, and more.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)]()

### ✨ Key Features

#### 🎓 Student-Centric Tools
- **Deep Discounts**: Automatically find student pricing for services you already use (Spotify @ $5.99, Prime Student, etc.).
- **Savings Analytics**: See exactly how much you're saving with student plans vs. regular pricing.
- **Verification System**: Verify your `.edu` status to unlock exclusive features and badges.

#### 📊 Advanced Analytics
- **Spending Trends**: Visual area charts showing your monthly spending history.
- **Category Breakdown**: Detailed pie charts to understand where your money goes (Entertainment, Food, software, etc.).
- **Smart Insights**: AI-driven recommendations to switch to annual plans or cancel unused services.

#### 🔔 Smart Reminders
- **HTML Email Alerts**: Receive beautiful, branded emails before a subscription renews.
- **Custom Schedules**: Set alerts for 3, 7, or 14 days before billing.

#### 💳 Core Management
- **Full CRUD**: Add, edit, and delete subscriptions easily.
- **Dashboard**: A powerful, glassmorphic interface to manage everything in one place.

### 🛠️ Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS 4, Recharts.
- **Backend**: FastAPI, SQLite (SQLAlchemy), Jinja2 Templating, APScheduler.
- **Auth**: JWT Authentication with secure password hashing (SHA-256 + Salt).

---

<a name="russian"></a>
## 🇷🇺 Русский

**SubSaver Student Edition** — это современная платформа управления подписками, созданная специально для студентов. Она помогает отслеживать расходы, находить образовательные скидки и экономить на таких сервисах, как Spotify, Apple Music, Notion и других.

### ✨ Основные Возможности

#### 🎓 Инструменты для Студентов
- **Поиск Скидок**: Автоматическое определение доступных студенческих тарифов для ваших подписок.
- **Аналитика Экономии**: Наглядная карта, показывающая, сколько вы уже сэкономили и сколько еще можете сэкономить.
- **Система Верификации**: Подтверждение статуса студента через `.edu` почту для доступа к эксклюзивным функциям.

#### 📊 Продвинутая Аналитика
- **Тренды Расходов**: Графики (Area Chart), показывающие динамику ваших трат по месяцам.
- **Разбивка по Категориям**: Детальные диаграммы для понимания структуры расходов.
- **Умные Инсайты**: Рекомендации по переходу на годовые планы или отмене неиспользуемых сервисов.

#### 🔔 Умные Напоминания
- **Email-уведомления**: Красивые HTML-письма с напоминанием о предстоящих списаниях.
- **Настройка**: Выбор времени напоминания (за 3, 7 или 14 дней).

#### 💳 Управление Подписками
- **Полный Контроль**: Добавление, редактирование и удаление подписок в пару кликов.
- **Дашборд**: Стильный интерфейс в стиле Glassmorphism для удобной работы.

### 🚀 Запуск Проекта (Getting Started)

#### Backend (Серверная часть)
```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend (Клиентская часть)
```bash
cd frontend
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

---
**Built with ❤️ for students everywhere.**