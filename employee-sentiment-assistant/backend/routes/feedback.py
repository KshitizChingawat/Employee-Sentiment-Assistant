"""
Feedback Routes — submit feedback and trigger AI analysis.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.database.connection import get_db
from backend.models.models import User, Feedback, SentimentResult
from backend.schemas.schemas import FeedbackCreate, FeedbackOut
from backend.services.auth_service import get_current_user
from backend.services.ai_service import analyze_feedback
from backend.services.analytics_service import check_and_create_alerts

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("/submit", response_model=FeedbackOut, status_code=201)
async def submit_feedback(
    payload:          FeedbackCreate,
    background_tasks: BackgroundTasks,
    current_user:     User             = Depends(get_current_user),
    db:               AsyncSession     = Depends(get_db),
):
    """
    Submit employee feedback.
    Immediately triggers AI analysis and stores results.
    Alert check runs as a background task.
    """

    # Create feedback record
    feedback = Feedback(
        user_id      = None if payload.is_anonymous else current_user.id,
        content      = payload.content,
        department   = payload.department,
        company_id   = current_user.company_id,
        is_anonymous = payload.is_anonymous,
        source       = payload.source or "form",
    )
    db.add(feedback)
    await db.flush()

    # Run AI analysis
    try:
        ai_result = await analyze_feedback(payload.content)
    except Exception as e:
        # Never block submission — log and continue without AI result
        print(f"[Feedback] AI analysis failed for feedback {feedback.id}: {e}")
        ai_result = None

    # Store sentiment result
    if ai_result:
        sr = SentimentResult(
            feedback_id     = feedback.id,
            sentiment       = ai_result["sentiment"],
            emotion         = ai_result["emotion"],
            score           = ai_result["score"],
            confidence      = ai_result.get("confidence", 0.9),
            summary         = ai_result.get("summary"),
            recommendation  = ai_result.get("recommendation"),
            keywords        = ai_result.get("keywords", []),
            raw_ai_response = ai_result,
        )
        db.add(sr)
        await db.flush()

    # Schedule alert check in background
    background_tasks.add_task(
        check_and_create_alerts, db, current_user.company_id, payload.department
    )

    # Reload with relationship
    await db.refresh(feedback)
    stmt   = (
        select(Feedback)
        .options(selectinload(Feedback.sentiment_result))
        .where(Feedback.id == feedback.id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("/list", response_model=list[FeedbackOut])
async def list_feedback(
    department:   str  = None,
    limit:        int  = 50,
    offset:       int  = 0,
    current_user: User = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """
    List feedback entries.
    - Employees see only their own (non-anonymous)
    - HR/Admin see all entries for their company
    """
    stmt = (
        select(Feedback)
        .options(selectinload(Feedback.sentiment_result))
        .where(Feedback.company_id == current_user.company_id)
        .order_by(Feedback.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    if department:
        stmt = stmt.where(Feedback.department == department)

    if current_user.role == "employee":
        stmt = stmt.where(
            Feedback.user_id == current_user.id,
            Feedback.is_anonymous == False,
        )

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{feedback_id}", response_model=FeedbackOut)
async def get_feedback(
    feedback_id:  int,
    current_user: User        = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """Get a single feedback entry by ID."""
    stmt   = (
        select(Feedback)
        .options(selectinload(Feedback.sentiment_result))
        .where(
            Feedback.id         == feedback_id,
            Feedback.company_id == current_user.company_id,
        )
    )
    result = await db.execute(stmt)
    fb     = result.scalar_one_or_none()

    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")

    # Employees can only view their own non-anonymous entries
    if current_user.role == "employee" and fb.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return fb
