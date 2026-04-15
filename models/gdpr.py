"""DSGVO-Modelle: Einwilligungen, Audit-Log, Löschanträge."""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def _uuid():
    return str(uuid.uuid4())


class GdprConsent(Base):
    """DSGVO-Einwilligung eines Bewerbers."""
    __tablename__ = "gdpr_consents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    applicant_id: Mapped[str] = mapped_column(String(36), ForeignKey("applicants.id"))
    tenant_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Art der Einwilligung
    consent_type: Mapped[str] = mapped_column(String(100))
    # datenspeicherung | kontaktaufnahme | weitergabe_kunde | newsletter

    given: Mapped[bool] = mapped_column(Boolean, default=True)
    given_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    given_via: Mapped[str] = mapped_column(String(100), default="chat")
    # chat | email | telefon | formular | schriftlich

    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    revoked_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Gesetzliche Grundlage
    legal_basis: Mapped[str] = mapped_column(String(100), default="Art. 6 Abs. 1 lit. a DSGVO")
    purpose: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "consent_type": self.consent_type,
            "given": self.given,
            "given_at": self.given_at.isoformat(),
            "given_via": self.given_via,
            "revoked": self.revoked,
            "legal_basis": self.legal_basis,
        }


class AuditLog(Base):
    """Unveränderliches Protokoll aller Systemaktionen (DSGVO Art. 5 Abs. 2)."""
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tenant_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    actor: Mapped[str] = mapped_column(String(200))  # "agent" | "mitarbeiter@firma.de" | "system"
    action: Mapped[str] = mapped_column(String(200))  # z.B. "bewerber.angelegt"
    resource_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Was wurde verändert?
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    # Sensible Felder NICHT loggen (kein Passwort, kein Volltext von Bewerbungen)

    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "actor": self.actor,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "success": self.success,
        }


class DeletionRequest(Base):
    """Löschantrag eines Bewerbers (DSGVO Art. 17 – Recht auf Vergessenwerden)."""
    __tablename__ = "deletion_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    applicant_id: Mapped[str] = mapped_column(String(36))
    tenant_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    requester_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(String(50), default="ausstehend")
    # ausstehend | verarbeitet | abgelehnt

    anonymized: Mapped[bool] = mapped_column(Boolean, default=False)
    anonymized_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    processed_by: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "applicant_id": self.applicant_id,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
        }
