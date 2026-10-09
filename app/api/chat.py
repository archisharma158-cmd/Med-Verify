"""Chatbot routes with Gemini integration and scan context."""
from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.core.logging import get_logger
from app.core.security import CurrentUser, get_optional_user
from app.database import get_db
from app.models.models import ScanHistory
from app.schemas.schemas import ChatRequest, ChatResponse
from app.services.gemini_service import chat_with_context

logger = get_logger("chat_routes")
router = APIRouter(prefix="/api/chat", tags=["Chatbot"])


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    user: Optional[CurrentUser] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Interact with the MedVerify AI Assistant.
    
    Accepts user queries in English or Hindi. If `scan_id` is provided,
    retrieves previous scan context to deliver grounded, explainable answers
    without hallucinating or giving medical advice.
    """
    scan_context = None

    if body.scan_id:
        query = select(ScanHistory).where(ScanHistory.id == body.scan_id)
        result = await db.execute(query)
        scan = result.scalar_one_or_none()

        if scan:
            if scan.result_json:
                try:
                    scan_context = json.loads(scan.result_json)
                except Exception:
                    scan_context = {
                        "medicine_name": scan.medicine_name,
                        "manufacturer": scan.manufacturer,
                        "batch_number": scan.batch_number,
                        "risk_category": scan.risk_category,
                        "verification_status": scan.verification_status,
                    }
            else:
                scan_context = {
                    "medicine_name": scan.medicine_name,
                    "manufacturer": scan.manufacturer,
                    "batch_number": scan.batch_number,
                    "risk_category": scan.risk_category,
                    "verification_status": scan.verification_status,
                }

    res = await chat_with_context(
        message=body.message,
        language=body.language,
        scan_context=scan_context,
    )

    return ChatResponse(
        reply=res.get("reply", ""),
        language=res.get("language", body.language),
        sources=res.get("sources", []),
    )
