"""Bewerber-Modelle."""

import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, Boolean, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Applicant(Base):
    """Bewerber in der Datenbank."""
    __tablename__ = "applicants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Persönliche Daten
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    date_of_birth: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    nationality: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Berufliche Daten
    desired_position: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    skills: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-Liste
    experience_years: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    education: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    languages: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-Liste
    availability_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    desired_salary: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Status
    status: Mapped[str] = mapped_column(String(50), default="neu")
    # neu | in_prüfung | qualifiziert | eingeladen | im_gespräch | vermittelt | abgelehnt | inaktiv
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # woher kam der Bewerber

    # Dokumente (Pfade oder URLs)
    cv_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    certificates_paths: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON

    # Verknüpfungen
    qualification_checks: Mapped[List["QualificationCheck"]] = relationship(
        back_populates="applicant", cascade="all, delete-orphan"
    )
    appointments: Mapped[List["Appointment"]] = relationship(
        back_populates="applicant", cascade="all, delete-orphan"
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "full_name": self.full_name,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "desired_position": self.desired_position,
            "skills": self.skills,
            "experience_years": self.experience_years,
            "status": self.status,
            "availability_date": self.availability_date,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class QualificationCheck(Base):
    """Qualifikationsprüfung eines Bewerbers."""
    __tablename__ = "qualification_checks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    applicant_id: Mapped[str] = mapped_column(String(36), ForeignKey("applicants.id"))
    applicant: Mapped["Applicant"] = relationship(back_populates="qualification_checks")

    # Prüfungsergebnis
    job_order_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("job_orders.id"), nullable=True)
    overall_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 0-100
    skill_match_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    experience_match_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    availability_match: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    # Detaillierte Bewertung
    strengths: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-Liste
    gaps: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-Liste
    recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_analysis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    passed: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    checked_by_agent: Mapped[bool] = mapped_column(Boolean, default=True)
    confirmed_by_staff: Mapped[bool] = mapped_column(Boolean, default=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "applicant_id": self.applicant_id,
            "job_order_id": self.job_order_id,
            "overall_score": self.overall_score,
            "skill_match_score": self.skill_match_score,
            "recommendation": self.recommendation,
            "passed": self.passed,
            "confirmed_by_staff": self.confirmed_by_staff,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
