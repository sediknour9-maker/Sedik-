"""Chat-Endpunkt für den Recruiting-Agenten – mit Mandanten-Support."""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from agent import RecruitmentAgent
from models import Conversation, ConversationMessage
from services.tenant_service import TenantService

router = APIRouter(prefix="/agent", tags=["Agent"])
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    tenant_short: Optional[str] = None   # z.B. "alero"


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    iterations: int


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    x_tenant: Optional[str] = Header(None),  # Alternativ per Header
):
    """Sendet eine Nachricht an den Recruiting-Agenten."""

    # Mandanten ermitteln (aus Request-Body oder Header)
    tenant_short = request.tenant_short or x_tenant
    tenant = None
    tenant_system_prompt = None

    if tenant_short:
        svc = TenantService(db)
        tenant = await svc.get_by_short(tenant_short)
        if tenant:
            from agent.prompts import SYSTEM_PROMPT
            tenant_system_prompt = svc.build_agent_system_prompt(tenant, SYSTEM_PROMPT)

    # Konversation laden oder neu erstellen
    from sqlalchemy import select
    conversation = None
    if request.conversation_id:
        result = await db.execute(
            select(Conversation).where(Conversation.id == request.conversation_id)
        )
        conversation = result.scalar_one_or_none()

    if not conversation:
        conversation = Conversation(channel="chat")
        db.add(conversation)
        await db.flush()

    # Bestehende Nachrichten laden
    messages = []
    if conversation.messages:
        for msg in conversation.messages:
            if msg.role in ("user", "assistant"):
                messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": request.message})

    db.add(ConversationMessage(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    ))

    # Agent ausführen (mit oder ohne Tenant-Prompt)
    agent = RecruitmentAgent(db)
    if tenant_system_prompt:
        agent._tenant_system_prompt = tenant_system_prompt

    result = await agent.chat(messages, conversation_id=conversation.id)

    db.add(ConversationMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=result["response"],
    ))
    await db.flush()

    return ChatResponse(
        response=result["response"],
        conversation_id=conversation.id,
        iterations=result["iterations"],
    )


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    """Gibt den Gesprächsverlauf zurück."""
    from sqlalchemy import select
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Konversation nicht gefunden.")
    return {
        "conversation": conv.to_dict(),
        "messages": [
            {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()}
            for m in conv.messages
        ],
    }
