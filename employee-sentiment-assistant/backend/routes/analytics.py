"""
Analytics Routes — aggregated sentiment data for dashboards.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.connection import get_db
from backend.models.models import User
from backend.schemas.schemas import AnalyticsSummary
from backend.services.auth_service import get_current_user, require_hr_or_admin
from backend.services.analytics_service import get_analytics_summary

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary")
async def analytics_summary(
    current_user: User        = Depends(require_hr_or_admin),
    db:           AsyncSession = Depends(get_db),
):
    """Full analytics summary — HR and Admin only."""
    return await get_analytics_summary(db, current_user.company_id)


@router.get("/my")
async def my_analytics(
    current_user: User        = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """
    Employee self-analytics — returns a simplified view
    without revealing other employees' data.
    """
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from backend.models.models import Feedback

    stmt = (
        select(Feedback)
        .options(selectinload(Feedback.sentiment_result))
        .where(
            Feedback.user_id    == current_user.id,
            Feedback.company_id == current_user.company_id,
        )
        .order_by(Feedback.created_at.desc())
        .limit(30)
    )
    result    = await db.execute(stmt)
    feedbacks = result.scalars().all()

    total    = len(feedbacks)
    pos      = sum(1 for fb in feedbacks if fb.sentiment_result and fb.sentiment_result.sentiment == "positive")
    neg      = sum(1 for fb in feedbacks if fb.sentiment_result and fb.sentiment_result.sentiment == "negative")
    neu      = total - pos - neg
    scores   = [fb.sentiment_result.score for fb in feedbacks if fb.sentiment_result]
    avg      = round(sum(scores) / len(scores), 2) if scores else 0.0

    return {
        "total":     total,
        "positive":  pos,
        "negative":  neg,
        "neutral":   neu,
        "avg_score": avg,
        "recent":    [
            {
                "date":      fb.created_at.strftime("%Y-%m-%d"),
                "sentiment": fb.sentiment_result.sentiment if fb.sentiment_result else None,
                "emotion":   fb.sentiment_result.emotion   if fb.sentiment_result else None,
            }
            for fb in feedbacks[:10]
        ],
    }
