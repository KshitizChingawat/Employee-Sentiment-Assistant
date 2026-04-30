"""
SentimentAI — Employee Sentiment Analysis Platform
FastAPI Application Entry Point
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

from backend.database.connection import init_db
from backend.routes.auth      import router as auth_router
from backend.routes.feedback  import router as feedback_router
from backend.routes.analytics import router as analytics_router
from backend.routes.alerts    import router as alerts_router
from backend.routes.chatbot   import router as chatbot_router
from backend.routes.reports   import router as reports_router


# ──────────────────── Lifespan ────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialise DB tables."""
    print("[SentimentAI] Starting up — initialising database...")
    await init_db()
    print("[SentimentAI] Database ready.")
    yield
    print("[SentimentAI] Shutting down.")


# ──────────────────── App Config ──────────────────────────────

app = FastAPI(
    title       = "SentimentAI — Employee Sentiment Analysis",
    description = "AI-powered HR sentiment analysis platform with real-time insights.",
    version     = "1.0.0",
    lifespan    = lifespan,
)

# CORS — allow the React frontend
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins     = CORS_ORIGINS,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ──────────────────── Routers ─────────────────────────────────

app.include_router(auth_router)
app.include_router(feedback_router)
app.include_router(analytics_router)
app.include_router(alerts_router)
app.include_router(chatbot_router)
app.include_router(reports_router)


# ──────────────────── Health Check ───────────────────────────

@app.get("/", tags=["health"])
async def root():
    return {
        "status":  "healthy",
        "service": "SentimentAI API",
        "version": "1.0.0",
        "demo_mode": os.getenv("DEMO_MODE", "true"),
    }


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}


# ──────────────────── Global Error Handlers ──────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"[Error] Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again."},
    )


# ──────────────────── Dev Runner ─────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host    = "0.0.0.0",
        port    = int(os.getenv("PORT", 8000)),
        reload  = True,
        workers = 1,
    )
