"""
Pydantic v2 Schemas — request/response validation for all API routes.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


# ─────────────────── Auth Schemas ───────────────────

class UserRegister(BaseModel):
    email:      EmailStr
    name:       str = Field(..., min_length=2, max_length=150)
    password:   str = Field(..., min_length=6)
    department: Optional[str] = None
    role:       Optional[str] = "employee"
    company_id: Optional[int] = 1


class UserLogin(BaseModel):
    email:    EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user: dict


class UserOut(BaseModel):
    id:         int
    email:      str
    name:       str
    role:       str
    department: Optional[str]
    company_id: int
    is_active:  bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────── Feedback Schemas ───────────────────

class FeedbackCreate(BaseModel):
    content:      str = Field(..., min_length=10, max_length=5000)
    department:   str = Field(..., min_length=1)
    is_anonymous: bool = False
    source:       Optional[str] = "form"

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Feedback content cannot be empty")
        return v.strip()


class SentimentResultOut(BaseModel):
    id:             int
    sentiment:      str
    emotion:        str
    score:          float
    confidence:     float
    summary:        Optional[str]
    recommendation: Optional[str]
    keywords:       List[str]
    created_at:     datetime

    model_config = {"from_attributes": True}


class FeedbackOut(BaseModel):
    id:           int
    content:      str
    department:   str
    is_anonymous: bool
    source:       str
    created_at:   datetime
    sentiment_result: Optional[SentimentResultOut] = None

    model_config = {"from_attributes": True}


# ─────────────────── Analytics Schemas ───────────────────

class SentimentDistribution(BaseModel):
    positive: int
    negative: int
    neutral:  int
    total:    int


class DepartmentStat(BaseModel):
    department:       str
    total:            int
    positive_pct:     float
    negative_pct:     float
    neutral_pct:      float
    avg_score:        float
    top_emotions:     List[str]


class TrendPoint(BaseModel):
    date:     str
    positive: int
    negative: int
    neutral:  int
    avg_score: float


class KeywordStat(BaseModel):
    keyword: str
    count:   int
    sentiment: str


class AnalyticsSummary(BaseModel):
    overall_sentiment:      SentimentDistribution
    department_breakdown:   List[DepartmentStat]
    trend_data:             List[TrendPoint]
    top_keywords:           List[KeywordStat]
    avg_sentiment_score:    float
    total_feedback_count:   int
    alert_count:            int
    most_stressed_dept:     Optional[str]


# ─────────────────── Alert Schemas ───────────────────

class AlertOut(BaseModel):
    id:          int
    department:  Optional[str]
    alert_type:  str
    message:     str
    severity:    str
    is_resolved: bool
    created_at:  datetime

    model_config = {"from_attributes": True}


class AlertResolve(BaseModel):
    alert_id: int


# ─────────────────── Chatbot Schemas ───────────────────

class ChatMessage(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


class ChatResponse(BaseModel):
    response: str
    sources:  Optional[List[str]] = []


# ─────────────────── Report Schemas ───────────────────

class ReportCreate(BaseModel):
    title:       str
    report_type: str = "pdf"       # pdf | csv
    department:  Optional[str] = None


class ReportOut(BaseModel):
    id:          int
    title:       str
    report_type: str
    department:  Optional[str]
    file_path:   Optional[str]
    created_at:  datetime

    model_config = {"from_attributes": True}
