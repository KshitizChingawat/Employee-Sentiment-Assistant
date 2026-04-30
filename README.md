# 🧠 SentimentAI — Employee Sentiment Analysis Platform

> AI-powered HR intelligence platform for real-time employee sentiment tracking, emotion detection, and actionable insights.

![Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Stack](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Stack](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Stack](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)
![Stack](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎭 **Sentiment Analysis** | AI classifies feedback as Positive / Negative / Neutral |
| 😤 **Emotion Detection** | Detects Stress, Burnout, Anger, Satisfaction, Anxiety, Joy |
| 📊 **Live Dashboard** | Real-time charts — Pie, Area, Bar, Radar, Scatter |
| 🚨 **Smart Alerts** | Auto-triggered alerts on negativity spikes |
| 🤖 **HR Chatbot** | Ask natural language questions about your org's sentiment |
| 🔒 **Anonymous Feedback** | Employee anonymity for honest submissions |
| 👥 **Role-Based Access** | Admin / HR / Employee roles with distinct views |
| 📥 **CSV Export** | Download full sentiment reports |
| 🏢 **Multi-tenant** | Built for multi-company SaaS architecture |
| 🎮 **Demo Mode** | Works fully without an OpenAI API key |

---

## 🔐 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | alice@demo.com | demo1234 |
| **HR** | bob@demo.com | demo1234 |
| **Employee** | david@demo.com | demo1234 |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+ (or use Docker)

---

### Option A — Docker Compose (Easiest)

```bash
# Clone and navigate
cd employee-sentiment-assistant

# Copy env and configure
cp backend/.env.example backend/.env
# Edit backend/.env if needed (defaults work for Docker)

# Launch everything
docker-compose up --build

# In a separate terminal — seed demo data
docker-compose exec backend python setup_db.py
```

Visit: http://localhost:5173

---

### Option B — Manual Setup

#### 1. PostgreSQL
```bash
# Create database
psql -U postgres -c "CREATE DATABASE sentiment_db;"
```

#### 2. Backend
```bash
cd employee-sentiment-assistant

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env:
#   DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASS@localhost:5432/sentiment_db
#   SECRET_KEY=your-random-secret-key-min-32-chars
#   OPENAI_API_KEY=sk-... (optional — leave blank for demo mode)
#   DEMO_MODE=true

# Create tables + seed demo data
python setup_db.py

# Start backend
uvicorn backend.main:app --reload --port 8000
```

#### 3. Frontend
```bash
cd frontend

# Install dependencies
npm install

# Configure
cp .env.example .env
# VITE_API_URL=http://localhost:8000 (default)

# Start dev server
npm run dev
```

Visit: http://localhost:5173

---

## 🌐 Deploy to Render

### 1. Push to GitHub
```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/sentimentai.git
git push -u origin main
```

### 2. Deploy via render.yaml
1. Go to https://render.com → New → Blueprint
2. Connect your GitHub repo
3. Render reads `render.yaml` and provisions:
   - PostgreSQL database
   - FastAPI backend service
   - React static frontend
4. Add your `OPENAI_API_KEY` in the backend service's Environment tab
5. SSH into backend and run: `python setup_db.py`

### Manual Render Setup (Alternative)

**Backend:**
- Type: Web Service
- Runtime: Python
- Build: `pip install -r backend/requirements.txt`
- Start: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Env vars: `DATABASE_URL`, `SECRET_KEY`, `OPENAI_API_KEY`, `DEMO_MODE=false`

**Frontend:**
- Type: Static Site
- Build: `cd frontend && npm install && npm run build`
- Publish dir: `frontend/dist`
- Env var: `VITE_API_URL=https://your-backend.onrender.com`
- Rewrite rule: `/* → /index.html`

---

## 📁 Project Structure

```
employee-sentiment-assistant/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── database/
│   │   └── connection.py        # SQLAlchemy async engine + session
│   ├── models/
│   │   └── models.py            # ORM: User, Feedback, SentimentResult, Alert
│   ├── schemas/
│   │   └── schemas.py           # Pydantic request/response schemas
│   ├── routes/
│   │   ├── auth.py              # Register, Login, Profile
│   │   ├── feedback.py          # Submit, List, Get feedback
│   │   ├── analytics.py         # Dashboard summary data
│   │   ├── alerts.py            # Active alerts + resolve
│   │   ├── chatbot.py           # HR AI chatbot
│   │   └── reports.py           # CSV export
│   ├── services/
│   │   ├── ai_service.py        # OpenAI integration + demo fallback
│   │   ├── auth_service.py      # JWT + password hashing
│   │   └── analytics_service.py # Data aggregation logic
│   ├── seed_data.py             # Realistic demo data seeder
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/client.js        # Axios client + all API calls
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx    # Main HR dashboard
│   │   │   ├── Analytics.jsx    # Deep analytics
│   │   │   ├── SubmitFeedback.jsx
│   │   │   └── FeedbackList.jsx
│   │   ├── components/
│   │   │   └── Layout.jsx       # Sidebar navigation
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── setup_db.py                  # One-shot DB init + seed
├── docker-compose.yml           # Full stack Docker setup
├── Dockerfile.backend
├── render.yaml                  # Render.com deployment config
└── README.md
```

---

## 🔌 API Reference

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Get JWT token |
| GET  | `/api/auth/me` | Any | Current user profile |
| POST | `/api/feedback/submit` | Any | Submit + analyze feedback |
| GET  | `/api/feedback/list` | Any | List feedback (role-filtered) |
| GET  | `/api/analytics/summary` | HR/Admin | Full dashboard data |
| GET  | `/api/analytics/my` | Employee | Personal sentiment data |
| GET  | `/api/alerts/` | HR/Admin | Active alerts |
| PATCH| `/api/alerts/{id}/resolve` | HR/Admin | Resolve alert |
| POST | `/api/chatbot/ask` | HR/Admin | HR AI chatbot query |
| GET  | `/api/reports/export/csv` | HR/Admin | Download CSV report |

---

## 🤖 AI Integration

### With OpenAI API Key
Set `OPENAI_API_KEY` and `DEMO_MODE=false` to use **GPT-4o-mini** for:
- Sentiment classification
- Emotion detection
- Feedback summarization
- HR recommendations

### Without API Key (Demo Mode)
Set `DEMO_MODE=true`. The platform uses a built-in heuristic engine that:
- Analyzes keyword sentiment indicators
- Returns realistic dummy summaries and recommendations
- Fully powers the dashboard with seeded data

**Demo Mode is perfect for evaluation and development.**

---

## 🔒 Security

- Passwords hashed with **bcrypt**
- JWTs signed with **HS256** (configurable expiry, default 24h)
- Anonymous feedback: user_id set to NULL in DB
- Role-based route guards at both API and frontend levels
- CORS configured per `CORS_ORIGINS` env var

---

## 📈 Scaling Notes

| Concern | Solution |
|---|---|
| AI latency | Move to async background task with Celery + Redis |
| DB queries | Add Redis caching for analytics aggregations |
| Multi-tenant | `company_id` is present on all tables — extend routing |
| High write volume | Add PostgreSQL connection pooling (PgBouncer) |
| Real-time updates | Add WebSocket endpoint + Server-Sent Events |

---

## 🧪 Test Feedback Samples

Try submitting these to see different AI analyses:

**Positive:** "I love working with my team. The collaboration culture here is fantastic and I feel my contributions are recognized and valued."

**Negative:** "I'm completely burned out. I've been working 70-hour weeks and nobody seems to care. The deadlines are impossible and I'm thinking about quitting."

**Neutral:** "The recent changes have been interesting. Some things improved but I'm still waiting to see how the new process plays out."

---

## 📄 License

MIT — free to use, modify, and deploy.

---


