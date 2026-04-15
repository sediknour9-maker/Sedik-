"""Genehmigungsanfragen-Modell für Human-in-the-Loop."""

import uuid
from datetime import datetime
from typing import Optional
from enum import Enum as PyEnum
from sqlalchemy import String, Text, DateTime, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def generate_uuid():
    return str(uuid.uuid4())


class ApprovalStatus(str, PyEnum):
    AUSSTEHEND = "ausstehend"
    GENEHMIGT = "genehmigt"
    ABGELEHNT = "abgelehnt"
    ABGELAUFEN = "abgelaufen"


class ApprovalRequest(Base):
    """Genehmigungsanfrage an Mitarbeiter für kritische Aktionen."""
    __tablename__ = "approval_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Was soll genehmigt werden?
    action_type: Mapped[str] = mapped_column(String(100))
    # bewerber_anlegen | qualifizierung_bestaetigen | auftrag_anlegen |
    # einladung_senden | termin_bestaetigen | email_senden | eskalation

    action_title: Mapped[str] = mapped_column(String(300))
    action_description: Mapped[str] = mapped_column(Text)
    action_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON der Aktion

    # Kontext
    applicant_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    job_order_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    appointment_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    conversation_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Status
    status: Mapped[ApprovalStatus] = mapped_column(
        Enum(ApprovalStatus), default=ApprovalStatus.AUSSTEHEND
    )
    token: Mapped[str] = mapped_column(String(100), default=generate_uuid)  # Für sichere URL

    # Benachrichtigung
    notification_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    notification_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Antwort des Mitarbeiters
    decided_by: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    decision_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Nach Entscheidung auszuführende Aktion (Callback-Info)
    callback_executed: Mapped[bool] = mapped_column(Boolean, default=False)
    callback_result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "action_type": self.action_type,
            "action_title": self.action_title,
            "action_description": self.action_description,
            "status": self.status.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "decided_by": self.decided_by,
            "decided_at": self.decided_at.isoformat() if self.decided_at else None,
            "decision_note": self.decision_note,
        }
