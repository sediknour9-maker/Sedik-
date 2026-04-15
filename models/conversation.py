"""Gesprächs-Modell für Telefonate und Chat-Sitzungen."""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Conversation(Base):
    """Eine Gesprächssitzung (Telefonat, Chat, etc.)."""
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    channel: Mapped[str] = mapped_column(String(50), default="chat")
    # chat | telefon | email

    caller_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    caller_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    twilio_call_sid: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    applicant_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="aktiv")
    # aktiv | beendet | übergeben

    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    messages: Mapped[list["ConversationMessage"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan", order_by="ConversationMessage.created_at"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "channel": self.channel,
            "caller_phone": self.caller_phone,
            "caller_name": self.caller_name,
            "applicant_id": self.applicant_id,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ConversationMessage(Base):
    """Einzelne Nachricht in einer Konversation."""
    __tablename__ = "conversation_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    conversation_id: Mapped[str] = mapped_column(String(36), default=generate_uuid)
    conversation: Mapped["Conversation"] = relationship(back_populates="messages")

    role: Mapped[str] = mapped_column(String(20))  # user | assistant | system | tool
    content: Mapped[str] = mapped_column(Text)
    tool_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tool_result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
