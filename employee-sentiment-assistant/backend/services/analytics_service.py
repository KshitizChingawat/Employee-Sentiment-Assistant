"""
Analytics Service — aggregates sentiment data for dashboards and reports.
"""

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from backend.models.models import Feedback, SentimentResult, Alert


async def get_analytics_summary(db: AsyncSession, company_id: int = 1) -> dict:
    """Compute full analytics summary for a company."""

    # ── 1. Fetch all feedback with sentiment results ──
    stmt = (
        select(Feedback)
        .options(selectinload(Feedback.sentiment_result))
        .where(Feedback.company_id == company_id)
        .order_by(Feedback.created_at.desc())
    )
    result   = await db.execute(stmt)
    feedbacks = result.scalars().all()

    # ── 2. Overall sentiment distribution ──
    sentiment_counts = Counter()
    dept_data        = defaultdict(lambda: {"positive": 0, "negative": 0, "neutral": 0,
                                             "scores": [], "emotions": []})
    trend_data       = defaultdict(lambda: {"positive": 0, "negative": 0, "neutral": 0, "scores": []})
    all_keywords     = Counter()
    keyword_sentiment = {}

    for fb in feedbacks:
        if not fb.sentiment_result:
            continue
        sr = fb.sentiment_result
        s  = sr.sentiment

        sentiment_counts[s] += 1
        dept_data[fb.department][s] += 1
        dept_data[fb.department]["scores"].append(sr.score)
        dept_data[fb.department]["emotions"].append(sr.emotion)

        # Trend by day (last 30 days)
        day_key = fb.created_at.strftime("%Y-%m-%d") if fb.created_at else "unknown"
        trend_data[day_key][s]   += 1
        trend_data[day_key]["scores"].append(sr.score)

        # Keywords
        for kw in (sr.keywords or []):
            all_keywords[kw] += 1
            keyword_sentiment[kw] = s  # Last occurrence wins (simplified)

    total = sum(sentiment_counts.values())

    # ── 3. Department breakdown ──
    dept_breakdown = []
    for dept, data in dept_data.items():
        d_total = data["positive"] + data["negative"] + data["neutral"]
        scores  = data["scores"]
        emotions = data["emotions"]
        top_emotions = [e for e, _ in Counter(emotions).most_common(2)]
        dept_breakdown.append({
            "department":   dept,
            "total":        d_total,
            "positive_pct": round(data["positive"] / d_total * 100, 1) if d_total else 0,
            "negative_pct": round(data["negative"] / d_total * 100, 1) if d_total else 0,
            "neutral_pct":  round(data["neutral"]  / d_total * 100, 1) if d_total else 0,
            "avg_score":    round(sum(scores) / len(scores), 2) if scores else 0.0,
            "top_emotions": top_emotions,
        })

    # Most stressed department (lowest avg_score)
    most_stressed = None
    if dept_breakdown:
        worst = min(dept_breakdown, key=lambda x: x["avg_score"])
        if worst["avg_score"] < 0:
            most_stressed = worst["department"]

    # ── 4. Trend data (last 30 days, sorted) ──
    sorted_trends = sorted(trend_data.items())[-30:]
    trend_list = []
    for day, data in sorted_trends:
        scores = data["scores"]
        trend_list.append({
            "date":      day,
            "positive":  data["positive"],
            "negative":  data["negative"],
            "neutral":   data["neutral"],
            "avg_score": round(sum(scores) / len(scores), 2) if scores else 0.0,
        })

    # ── 5. Top keywords ──
    top_keywords = [
        {"keyword": kw, "count": cnt, "sentiment": keyword_sentiment.get(kw, "neutral")}
        for kw, cnt in all_keywords.most_common(15)
    ]

    # ── 6. Active alert count ──
    alert_stmt   = select(func.count()).where(
        and_(Alert.company_id == company_id, Alert.is_resolved == False)
    )
    alert_result = await db.execute(alert_stmt)
    alert_count  = alert_result.scalar() or 0

    avg_score = 0.0
    if total > 0:
        all_scores = [
            fb.sentiment_result.score
            for fb in feedbacks
            if fb.sentiment_result
        ]
        avg_score = round(sum(all_scores) / len(all_scores), 2) if all_scores else 0.0

    return {
        "overall_sentiment": {
            "positive": sentiment_counts["positive"],
            "negative": sentiment_counts["negative"],
            "neutral":  sentiment_counts["neutral"],
            "total":    total,
        },
        "department_breakdown":  dept_breakdown,
        "trend_data":            trend_list,
        "top_keywords":          top_keywords,
        "avg_sentiment_score":   avg_score,
        "total_feedback_count":  total,
        "alert_count":           alert_count,
        "most_stressed_dept":    most_stressed,
    }


async def check_and_create_alerts(db: AsyncSession, company_id: int, department: str):
    """
    After each new feedback submission, check for alert conditions.
    Triggers alerts if negativity spike detected in last 24h.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

    stmt = (
        select(Feedback)
        .options(selectinload(Feedback.sentiment_result))
        .where(
            and_(
                Feedback.company_id == company_id,
                Feedback.department == department,
                Feedback.created_at >= cutoff,
            )
        )
    )
    result    = await db.execute(stmt)
    recent_fb = result.scalars().all()

    if len(recent_fb) < 3:
        return  # Not enough data

    negative_count = sum(
        1 for fb in recent_fb
        if fb.sentiment_result and fb.sentiment_result.sentiment == "negative"
    )
    neg_pct = negative_count / len(recent_fb)

    if neg_pct >= 0.6:
        # Check if similar alert already exists (avoid duplicates)
        existing_stmt = select(Alert).where(
            and_(
                Alert.company_id  == company_id,
                Alert.department  == department,
                Alert.is_resolved == False,
                Alert.alert_type  == "negativity_spike",
            )
        )
        existing = await db.execute(existing_stmt)
        if existing.scalar_one_or_none():
            return  # Alert already active

        severity = "critical" if neg_pct >= 0.8 else "high"
        alert    = Alert(
            company_id  = company_id,
            department  = department,
            alert_type  = "negativity_spike",
            message     = (
                f"{department} department: {int(neg_pct*100)}% negative sentiment "
                f"detected in the last 24 hours ({negative_count}/{len(recent_fb)} entries). "
                f"Immediate HR review recommended."
            ),
            severity    = severity,
        )
        db.add(alert)
        await db.flush()
