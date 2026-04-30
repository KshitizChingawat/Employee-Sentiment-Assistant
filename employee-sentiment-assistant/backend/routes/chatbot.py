"""
HR Chatbot Route — AI-powered assistant answering HR analytics queries.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.connection import get_db
from backend.models.models import User
from backend.schemas.schemas import ChatMessage, ChatResponse
from backend.services.auth_service import require_hr_or_admin
from backend.services.ai_service import hr_chatbot_response
from backend.services.analytics_service import get_analytics_summary

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])


@router.post("/ask", response_model=ChatResponse)
async def ask_chatbot(
    payload:      ChatMessage,
    current_user: User        = Depends(require_hr_or_admin),
    db:           AsyncSession = Depends(get_db),
):
    """
    Submit a natural-language HR question.
    The chatbot uses real analytics context to generate an informed response.
    """
    # Fetch live analytics as context for the AI
    context = await get_analytics_summary(db, current_user.company_id)

    response_text = await hr_chatbot_response(payload.message, context)

    return {"response": response_text, "sources": ["Live sentiment database"]}
