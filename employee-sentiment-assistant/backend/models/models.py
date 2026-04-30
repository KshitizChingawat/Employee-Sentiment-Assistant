"""
SQLAlchemy ORM Models — Employee Sentiment Analysis Platform
Tables: users, feedback, sentiment_results, alerts, reports
"""

from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean,
    DateTime, ForeignKey, Enum, JSON, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from backend.database.connection import Base


# ─────────────────────────── ENUMS ────────────────────────────

class UserRole(str, enum.Enum):
    admin  = "admin"
    hr     = "hr"
    employee = "employee"


class SentimentLabel(str, enum.Enum):
    positive = "positive"
    negative = "negative"
    neutral  = "neutral"


class EmotionLabel(str, enum.Enum):
    stress       = "stress"
    burnout      = "burnout"
    anger        = "anger"
    satisfaction = "satisfaction"
    anxiety      = "anxiety"
    joy          = "joy"
    frustration  = "frustration"
    neutral      = "neutral"


class AlertSeverity(str, enum.Enum):
    low      = "low"
    medium   = "medium"
    high     = "high"
    critical = "critical"


# ─────────────────────────── MODELS ───────────────────────────

class User(Base):
    """Platform user — supports multi-tenant via company_id."""
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    email      = Column(String(255), unique=True, nullable=False, index=True)
    name       = Column(String(150), nullable=False)
    password   = Column(String(255), nullable=False)
    role       = Column(Enum(UserRole), default=UserRole.employee, nullable=False)
    department = Column(String(100), nullable=True)
    company_id = Column(Integer, nullable=False, default=1)  # Multi-tenant
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    feedbacks = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")
    reports   = relationship("Report",   back_populates="generated_by_user")

    __table_args__ = (
        Index("ix_users_company_role", "company_id", "role"),
    )


class Feedback(Base):
    """Raw employee feedback submissions."""
    __tablename__ = "feedback"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    content      = Column(Text, nullable=False)
    department   = Column(String(100), nullable=False)
    company_id   = Column(Integer, nullable=False, default=1)
    is_anonymous = Column(Boolean, default=False)
    source       = Column(String(50), default="form")  # form | survey | chat
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user             = relationship("User", back_populates="feedbacks")
    sentiment_result = relationship("SentimentResult", back_populates="feedback",
                                    uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_feedback_company_dept", "company_id", "department"),
        Index("ix_feedback_created_at", "created_at"),
    )


class SentimentResult(Base):
    """AI-generated analysis result for each feedback entry."""
    __tablename__ = "sentiment_results"

    id              = Column(Integer, primary_key=True, index=True)
    feedback_id     = Column(Integer, ForeignKey("feedback.id", ondelete="CASCADE"),
                             unique=True, nullable=False)
    sentiment       = Column(Enum(SentimentLabel), nullable=False)
    emotion         = Column(Enum(EmotionLabel), nullable=False)
    score           = Column(Float, nullable=False)        # -1.0 to +1.0
    confidence      = Column(Float, default=0.9)
    summary         = Column(Text)
    recommendation  = Column(Text)
    keywords        = Column(JSON, default=list)           # ["keyword1", ...]
    raw_ai_response = Column(JSON)                         # Full OpenAI response stored
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    feedback = relationship("Feedback", back_populates="sentiment_result")

    __table_args__ = (
        Index("ix_sentiment_results_sentiment", "sentiment"),
    )


class Alert(Base):
    """Automated alerts triggered by sentiment spike detection."""
    __tablename__ = "alerts"

    id          = Column(Integer, primary_key=True, index=True)
    company_id  = Column(Integer, nullable=False, default=1)
    department  = Column(String(100), nullable=True)   # None = company-wide
    alert_type  = Column(String(100), nullable=False)  # negativity_spike | burnout | etc.
    message     = Column(Text, nullable=False)
    severity    = Column(Enum(AlertSeverity), default=AlertSeverity.medium)
    is_resolved = Column(Boolean, default=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_alerts_company_resolved", "company_id", "is_resolved"),
    )


class Report(Base):
    """Generated PDF/CSV reports for HR teams."""
    __tablename__ = "reports"

    id              = Column(Integer, primary_key=True, index=True)
    company_id      = Column(Integer, nullable=False, default=1)
    generated_by    = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title           = Column(String(255), nullable=False)
    report_type     = Column(String(50), default="pdf")    # pdf | csv
    department      = Column(String(100), nullable=True)   # None = all departments
    file_path       = Column(String(512), nullable=True)
    summary_data    = Column(JSON)                         # Cached stats snapshot
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    generated_by_user = relationship("User", back_populates="reports")
