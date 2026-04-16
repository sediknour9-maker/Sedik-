"""Mandanten-Modell – eine Konfiguration pro Zeitarbeitsfirma."""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


def _uuid():
    return str(uuid.uuid4())


class Tenant(Base):
    """Eine Zeitarbeitsfirma als eigenständiger Mandant."""
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Firmendaten
    company_name: Mapped[str] = mapped_column(String(200))
    company_short: Mapped[str] = mapped_column(String(50), unique=True)  # z.B. "sedik", "mueller-personal"
    legal_name: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    country: Mapped[str] = mapped_column(String(10), default="DE")
    data_protection_officer: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # DSB-Name
    data_protection_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Branding
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    primary_color: Mapped[str] = mapped_column(String(20), default="#1a56db")
    accent_color: Mapped[str] = mapped_column(String(20), default="#10b981")

    # Agent-Konfiguration
    agent_name: Mapped[str] = mapped_column(String(100), default="Recruiting-Agent")
    agent_greeting: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    agent_language: Mapped[str] = mapped_column(String(10), default="de")
    agent_persona: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Zusätzliche Persönlichkeit

    # E-Mail
    smtp_host: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    smtp_port: Mapped[int] = mapped_column(Integer, default=587)
    smtp_username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    smtp_password_enc: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # verschlüsselt
    email_from_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    email_from_address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email_signature: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Telefon
    phone_provider: Mapped[str] = mapped_column(String(50), default="twilio")
    # twilio | sipgate | placetel | sip_trunk | disabled
    business_phone_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    twilio_account_sid: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    twilio_auth_token_enc: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # SIP-Trunk (für bestehende Rufnummern)
    sip_domain: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    sip_username: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    sip_password_enc: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Sipgate-spezifisch
    sipgate_token_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    sipgate_token_enc: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Mitarbeiter-Benachrichtigung
    staff_emails: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # kommagetrennt
    staff_phones: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    approval_timeout_hours: Mapped[int] = mapped_column(Integer, default=24)

    # DSGVO / Datenschutz
    data_retention_days: Mapped[int] = mapped_column(Integer, default=730)  # 2 Jahre Standard
    auto_anonymize_rejected: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_anonymize_after_days: Mapped[int] = mapped_column(Integer, default=180)
    gdpr_consent_required: Mapped[bool] = mapped_column(Boolean, default=True)

    # Betriebsstatus
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    api_key: Mapped[str] = mapped_column(String(100), default=_uuid)  # Für API-Zugriff

    def get_staff_emails(self) -> list[str]:
        if not self.staff_emails:
            return []
        return [e.strip() for e in self.staff_emails.split(",") if e.strip()]

    def get_staff_phones(self) -> list[str]:
        if not self.staff_phones:
            return []
        return [p.strip() for p in self.staff_phones.split(",") if p.strip()]

    def to_dict(self, include_secrets: bool = False) -> dict:
        d = {
            "id": self.id,
            "company_name": self.company_name,
            "company_short": self.company_short,
            "legal_name": self.legal_name,
            "address": self.address,
            "city": self.city,
            "agent_name": self.agent_name,
            "agent_language": self.agent_language,
            "business_phone_number": self.business_phone_number,
            "phone_provider": self.phone_provider,
            "email_from_address": self.email_from_address,
            "staff_emails": self.staff_emails,
            "data_retention_days": self.data_retention_days,
            "auto_anonymize_rejected": self.auto_anonymize_rejected,
            "gdpr_consent_required": self.gdpr_consent_required,
            "primary_color": self.primary_color,
            "is_active": self.is_active,
        }
        if include_secrets:
            d["api_key"] = self.api_key
        return d
