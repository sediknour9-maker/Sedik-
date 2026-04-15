"""Chat-Endpunkt für den Recruiting-Agenten."""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from agent import RecruitmentAgent
from models import Conversation, ConversationMessage

router = APIRouter(prefix="/agent", tags=["Agent"])
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    iterations: int


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Sendet eine Nachricht an den Recruiting-Agenten."""

    # Konversation laden oder neu erstellen
    conversation = None
    if request.conversation_id:
        from sqlalchemy import select
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

    # Neue Nutzernachricht hinzufügen
    messages.append({"role": "user", "content": request.message})

    # Nutzernachricht speichern
    user_msg = ConversationMessage(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )
    db.add(user_msg)

    # Agent ausführen
    agent = RecruitmentAgent(db)
    result = await agent.chat(messages, conversation_id=conversation.id)

    # Antwort speichern
    assistant_msg = ConversationMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=result["response"],
    )
    db.add(assistant_msg)
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
