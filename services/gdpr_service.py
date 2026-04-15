"""DSGVO-Service: Audit-Log, Einwilligungen, Löschrecht, Anonymisierung."""

import json
import logging
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from models.gdpr import GdprConsent, AuditLog, DeletionRequest
from models.applicant import Applicant

logger = logging.getLogger(__name__)


class GdprService:
    """Stellt alle DSGVO-pflichtigen Funktionen bereit."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Audit-Log ─────────────────────────────────────────────────────────────

    async def log(
        self,
        actor: str,
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[dict] = None,
        tenant_id: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None,
    ) -> AuditLog:
        """Schreibt einen unveränderlichen Audit-Log-Eintrag."""
        # Sensible Felder aus details entfernen
        safe_details = None
        if details:
            SENSITIVE = {"password", "passwort", "token", "secret", "pin", "iban", "kontonummer"}
            safe = {k: v for k, v in details.items() if not any(s in k.lower() for s in SENSITIVE)}
            safe_details = json.dumps(safe, ensure_ascii=False, default=str)

        entry = AuditLog(
            actor=actor,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=safe_details,
            tenant_id=tenant_id,
            success=success,
            error_message=error_message,
        )
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def get_audit_log(
        self,
        resource_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        limit: int = 100,
    ) -> list[AuditLog]:
        stmt = select(AuditLog)
        if resource_id:
            stmt = stmt.where(AuditLog.resource_id == resource_id)
        if resource_type:
            stmt = stmt.where(AuditLog.resource_type == resource_type)
        stmt = stmt.order_by(AuditLog.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    # ── Einwilligungen ────────────────────────────────────────────────────────

    async def record_consent(
        self,
        applicant_id: str,
        consent_type: str,
        given_via: str = "chat",
        tenant_id: Optional[str] = None,
        purpose: Optional[str] = None,
    ) -> GdprConsent:
        """Speichert eine DSGVO-Einwilligung."""
        consent = GdprConsent(
            applicant_id=applicant_id,
            tenant_id=tenant_id,
            consent_type=consent_type,
            given=True,
            given_via=given_via,
            purpose=purpose,
        )
        self.db.add(consent)
        await self.db.flush()
        await self.log(
            actor="system",
            action=f"einwilligung.erteilt.{consent_type}",
            resource_type="applicant",
            resource_id=applicant_id,
            tenant_id=tenant_id,
        )
        return consent

    async def revoke_consent(
        self, applicant_id: str, consent_type: str, reason: str = ""
    ) -> Optional[GdprConsent]:
        """Widerruft eine Einwilligung."""
        result = await self.db.execute(
            select(GdprConsent).where(
                GdprConsent.applicant_id == applicant_id,
                GdprConsent.consent_type == consent_type,
                GdprConsent.revoked == False,
            )
        )
        consent = result.scalar_one_or_none()
        if consent:
            consent.revoked = True
            consent.revoked_at = datetime.utcnow()
            consent.revoked_reason = reason
            await self.db.flush()
            await self.log(
                actor="bewerber",
                action=f"einwilligung.widerrufen.{consent_type}",
                resource_type="applicant",
                resource_id=applicant_id,
            )
        return consent

    async def has_consent(self, applicant_id: str, consent_type: str) -> bool:
        result = await self.db.execute(
            select(GdprConsent).where(
                GdprConsent.applicant_id == applicant_id,
                GdprConsent.consent_type == consent_type,
                GdprConsent.given == True,
                GdprConsent.revoked == False,
            )
        )
        return result.scalar_one_or_none() is not None

    # ── Löschrecht (Art. 17 DSGVO) ────────────────────────────────────────────

    async def request_deletion(
        self,
        applicant_id: str,
        requester_email: str = "",
        reason: str = "",
        tenant_id: Optional[str] = None,
    ) -> DeletionRequest:
        """Erstellt einen Löschantrag."""
        req = DeletionRequest(
            applicant_id=applicant_id,
            tenant_id=tenant_id,
            requester_email=requester_email,
            reason=reason,
        )
        self.db.add(req)
        await self.db.flush()
        await self.log(
            actor=requester_email or "bewerber",
            action="loeschantrag.erstellt",
            resource_type="applicant",
            resource_id=applicant_id,
            tenant_id=tenant_id,
        )
        return req

    async def anonymize_applicant(
        self, applicant_id: str, processed_by: str = "system"
    ) -> bool:
        """
        Anonymisiert einen Bewerber (DSGVO Art. 17).
        Ersetzt personenbezogene Daten durch Platzhalter.
        Bewerbungs- und Qualifikationsdaten bleiben für Statistiken erhalten.
        """
        result = await self.db.execute(
            select(Applicant).where(Applicant.id == applicant_id)
        )
        applicant = result.scalar_one_or_none()
        if not applicant:
            return False

        # Personenbezogene Daten überschreiben
        applicant.first_name = "Anonym"
        applicant.last_name = f"[gelöscht-{applicant_id[:8]}]"
        applicant.email = None
        applicant.phone = None
        applicant.date_of_birth = None
        applicant.address = None
        applicant.nationality = None
        applicant.cv_path = None
        applicant.certificates_paths = None
        applicant.status = "inaktiv"
        applicant.notes = "[Daten auf Antrag anonymisiert]"

        await self.db.flush()

        # Löschantrag als erledigt markieren
        del_result = await self.db.execute(
            select(DeletionRequest).where(
                DeletionRequest.applicant_id == applicant_id,
                DeletionRequest.status == "ausstehend",
            )
        )
        for req in del_result.scalars().all():
            req.status = "verarbeitet"
            req.processed_at = datetime.utcnow()
            req.processed_by = processed_by
            req.anonymized = True
            req.anonymized_at = datetime.utcnow()

        await self.log(
            actor=processed_by,
            action="bewerber.anonymisiert",
            resource_type="applicant",
            resource_id=applicant_id,
            details={"grund": "loeschantrag_art17_dsgvo"},
        )
        logger.info(f"Bewerber {applicant_id} anonymisiert (DSGVO Art. 17).")
        return True

    async def auto_anonymize_old_records(self, days_threshold: int = 180) -> int:
        """
        Automatische Anonymisierung alter abgelehnter Bewerber.
        Läuft als geplanter Job (täglich).
        """
        cutoff = datetime.utcnow() - timedelta(days=days_threshold)
        result = await self.db.execute(
            select(Applicant).where(
                Applicant.status == "abgelehnt",
                Applicant.updated_at < cutoff,
                Applicant.first_name != "Anonym",
            )
        )
        applicants = list(result.scalars().all())
        count = 0
        for a in applicants:
            if await self.anonymize_applicant(a.id, processed_by="auto-system"):
                count += 1
        if count:
            logger.info(f"Auto-Anonymisierung: {count} Bewerber anonymisiert (älter als {days_threshold} Tage).")
        return count

    async def export_applicant_data(self, applicant_id: str) -> dict:
        """
        Datenauskunft nach DSGVO Art. 15 – gibt alle gespeicherten Daten zurück.
        """
        applicant_result = await self.db.execute(
            select(Applicant).where(Applicant.id == applicant_id)
        )
        applicant = applicant_result.scalar_one_or_none()
        if not applicant:
            return {"error": "Nicht gefunden"}

        consents_result = await self.db.execute(
            select(GdprConsent).where(GdprConsent.applicant_id == applicant_id)
        )
        consents = [c.to_dict() for c in consents_result.scalars().all()]

        audit_result = await self.db.execute(
            select(AuditLog).where(
                AuditLog.resource_id == applicant_id,
                AuditLog.resource_type == "applicant",
            ).order_by(AuditLog.created_at)
        )
        audit = [e.to_dict() for e in audit_result.scalars().all()]

        return {
            "auskunft_datum": datetime.utcnow().isoformat(),
            "rechtsgrundlage": "Art. 15 DSGVO – Auskunftsrecht",
            "bewerber": applicant.to_dict(),
            "einwilligungen": consents,
            "aktivitaetsprotokoll": audit,
            "hinweis": (
                "Diese Auskunft enthält alle über Sie gespeicherten personenbezogenen Daten. "
                "Sie können jederzeit Berichtigung (Art. 16) oder Löschung (Art. 17) beantragen."
            ),
        }
