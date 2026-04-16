"""Auftrags-Modell für Zeitarbeitsstellen."""

import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, Boolean, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


def generate_uuid():
    return str(uuid.uuid4())


class JobOrder(Base):
    """Stellenauftrag / Anforderung eines Kundenunternehmens."""
    __tablename__ = "job_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Auftraggeber (Kundenunternehmen)
    company_name: Mapped[str] = mapped_column(String(200))
    company_contact_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    company_contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    company_contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Stellenbeschreibung
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    required_skills: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-Liste
    required_experience_years: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    required_education: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    required_languages: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-Liste

    # Konditionen
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    start_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    end_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    positions_count: Mapped[int] = mapped_column(Integer, default=1)
    hourly_rate_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hourly_rate_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    work_hours_per_week: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    shift_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Früh/Spät/Nacht/Tagesschicht

    # Status
    status: Mapped[str] = mapped_column(String(50), default="offen")
    # offen | in_bearbeitung | besetzt | geschlossen | storniert
    priority: Mapped[str] = mapped_column(String(20), default="normal")  # niedrig | normal | hoch | dringend

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by_agent: Mapped[bool] = mapped_column(Boolean, default=True)
    confirmed_by_staff: Mapped[bool] = mapped_column(Boolean, default=False)

    # Verknüpfungen
    appointments: Mapped[List["Appointment"]] = relationship(
        back_populates="job_order", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "company_name": self.company_name,
            "title": self.title,
            "location": self.location,
            "start_date": self.start_date,
            "required_skills": self.required_skills,
            "status": self.status,
            "priority": self.priority,
            "positions_count": self.positions_count,
            "confirmed_by_staff": self.confirmed_by_staff,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
