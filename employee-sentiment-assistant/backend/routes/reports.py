"""
Reports Route — generate PDF/CSV sentiment reports.
"""

import io
import csv
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.database.connection import get_db
from backend.models.models import User, Feedback, SentimentResult
from backend.services.auth_service import require_hr_or_admin
from backend.services.analytics_service import get_analytics_summary

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/export/csv")
async def export_csv(
    department:   str  = None,
    current_user: User = Depends(require_hr_or_admin),
    db:           AsyncSession = Depends(get_db),
):
    """Export all feedback with sentiment results as CSV."""

    stmt = (
        select(Feedback)
        .options(selectinload(Feedback.sentiment_result))
        .where(Feedback.company_id == current_user.company_id)
        .order_by(Feedback.created_at.desc())
    )
    if department:
        stmt = stmt.where(Feedback.department == department)

    result   = await db.execute(stmt)
    feedbacks = result.scalars().all()

    # Build CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Department", "Anonymous", "Sentiment", "Emotion",
        "Score", "Keywords", "Summary", "Created At"
    ])

    for fb in feedbacks:
        sr = fb.sentiment_result
        writer.writerow([
            fb.id,
            fb.department,
            fb.is_anonymous,
            sr.sentiment       if sr else "",
            sr.emotion         if sr else "",
            sr.score           if sr else "",
            ", ".join(sr.keywords or []) if sr else "",
            (sr.summary or "").replace("\n", " ") if sr else "",
            fb.created_at.strftime("%Y-%m-%d %H:%M") if fb.created_at else "",
        ])

    output.seek(0)
    filename = f"sentiment_report{'_' + department if department else ''}.csv"

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/summary")
async def report_summary(
    current_user: User        = Depends(require_hr_or_admin),
    db:           AsyncSession = Depends(get_db),
):
    """JSON summary suitable for generating a PDF on the frontend."""
    return await get_analytics_summary(db, current_user.company_id)
