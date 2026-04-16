"""Termin-Modell für Bewerbungsgespräche und andere Termine."""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Appointment(Base):
    """Termin (Bewerbungsgespräch, Telefongespräch, etc.)."""
    __tablename__ = "appointments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Verknüpfungen
    applicant_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("applicants.id"), nullable=True)
    applicant: Mapped[Optional["Applicant"]] = relationship(back_populates="appointments")

    job_order_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("job_orders.id"), nullable=True)
    job_order: Mapped[Optional["JobOrder"]] = relationship(back_populates="appointments")

    # Termindetails
    appointment_type: Mapped[str] = mapped_column(String(50), default="bewerbungsgespraech")
    # bewerbungsgespraech | telefon | vorstellung_beim_kunden | nachfolgetermin

    title: Mapped[str] = mapped_column(String(200))
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(default=60)
    location: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    meeting_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Teilnehmer
    interviewer_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    interviewer_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Status
    status: Mapped[str] = mapped_column(String(50), default="vorgeschlagen")
    # vorgeschlagen | bestätigt | eingeladen | abgesagt | durchgeführt | nicht_erschienen

    # Einladung
    invitation_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    invitation_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    confirmation_token: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    applicant_confirmed: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    staff_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)

    # Erinnerungen
    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "applicant_id": self.applicant_id,
            "job_order_id": self.job_order_id,
            "appointment_type": self.appointment_type,
            "title": self.title,
            "scheduled_at": self.scheduled_at.isoformat() if self.scheduled_at else None,
            "duration_minutes": self.duration_minutes,
            "location": self.location,
            "status": self.status,
            "invitation_sent": self.invitation_sent,
            "staff_confirmed": self.staff_confirmed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
