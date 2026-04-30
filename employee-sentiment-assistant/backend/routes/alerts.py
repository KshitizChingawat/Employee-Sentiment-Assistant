"""
Alerts Routes — view and resolve HR alerts.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timezone

from backend.database.connection import get_db
from backend.models.models import User, Alert
from backend.schemas.schemas import AlertOut
from backend.services.auth_service import require_hr_or_admin

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertOut])
async def get_alerts(
    include_resolved: bool = False,
    current_user:     User        = Depends(require_hr_or_admin),
    db:               AsyncSession = Depends(get_db),
):
    """Return active (or all) alerts for the company."""
    conditions = [Alert.company_id == current_user.company_id]
    if not include_resolved:
        conditions.append(Alert.is_resolved == False)

    stmt   = select(Alert).where(and_(*conditions)).order_by(Alert.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.patch("/{alert_id}/resolve", response_model=AlertOut)
async def resolve_alert(
    alert_id:     int,
    current_user: User        = Depends(require_hr_or_admin),
    db:           AsyncSession = Depends(get_db),
):
    """Mark an alert as resolved."""
    result = await db.execute(
        select(Alert).where(
            Alert.id         == alert_id,
            Alert.company_id == current_user.company_id,
        )
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_resolved = True
    alert.resolved_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(alert)
    return alert
