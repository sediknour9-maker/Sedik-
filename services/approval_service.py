"""Genehmigungsworkflow – Human-in-the-Loop für kritische Aktionen."""

import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Callable, Awaitable
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models import ApprovalRequest, ApprovalStatus
from config import settings

logger = logging.getLogger(__name__)


class ApprovalService:
    """Verwaltet Genehmigungsanfragen für den Human-in-the-Loop-Workflow."""

    def __init__(self, db: AsyncSession, email_service=None):
        self.db = db
        self.email_service = email_service

    async def request_approval(
        self,
        action_type: str,
        action_title: str,
        action_description: str,
        action_data: Optional[dict] = None,
        applicant_id: Optional[str] = None,
        job_order_id: Optional[str] = None,
        appointment_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        notify_staff: bool = True,
    ) -> ApprovalRequest:
        """Erstellt eine neue Genehmigungsanfrage und benachrichtigt Mitarbeiter."""

        expires_at = datetime.utcnow() + timedelta(hours=settings.approval_timeout_hours)

        approval = ApprovalRequest(
            action_type=action_type,
            action_title=action_title,
            action_description=action_description,
            action_data=json.dumps(action_data) if action_data else None,
            applicant_id=applicant_id,
            job_order_id=job_order_id,
            appointment_id=appointment_id,
            conversation_id=conversation_id,
            expires_at=expires_at,
        )
        self.db.add(approval)
        await self.db.flush()

        if notify_staff and self.email_service:
            await self._notify_staff(approval)

        logger.info(f"Genehmigungsanfrage erstellt: {approval.id} – {action_title}")
        return approval

    async def _notify_staff(self, approval: ApprovalRequest) -> None:
        """Benachrichtigt Mitarbeiter per E-Mail."""
        staff_emails = settings.get_staff_email_list()
        if not staff_emails:
            logger.warning("Keine Mitarbeiter-E-Mails konfiguriert für Genehmigung.")
            return

        base_url = settings.app_url
        approval_link = f"{base_url}/api/approvals/{approval.id}/decide?token={approval.token}&decision=genehmigt"
        rejection_link = f"{base_url}/api/approvals/{approval.id}/decide?token={approval.token}&decision=abgelehnt"

        context = ""
        if approval.action_data:
            try:
                data = json.loads(approval.action_data)
                context = "\n".join(f"  {k}: {v}" for k, v in data.items() if v)
            except Exception:
                context = approval.action_data

        await self.email_service.send_staff_approval_request(
            staff_emails=staff_emails,
            action_title=approval.action_title,
            action_description=approval.action_description,
            approval_link=approval_link,
            rejection_link=rejection_link,
            context_info=context,
        )

        approval.notification_sent = True
        approval.notification_sent_at = datetime.utcnow()

    async def process_decision(
        self,
        approval_id: str,
        token: str,
        decision: str,  # "genehmigt" | "abgelehnt"
        decided_by: str = "Mitarbeiter",
        decision_note: str = "",
    ) -> Optional[ApprovalRequest]:
        """Verarbeitet die Entscheidung eines Mitarbeiters."""

        result = await self.db.execute(
            select(ApprovalRequest).where(ApprovalRequest.id == approval_id)
        )
        approval = result.scalar_one_or_none()

        if not approval:
            logger.warning(f"Genehmigungsanfrage {approval_id} nicht gefunden.")
            return None

        if approval.token != token:
            logger.warning(f"Ungültiger Token für Genehmigung {approval_id}.")
            return None

        if approval.status != ApprovalStatus.AUSSTEHEND:
            logger.info(f"Genehmigung {approval_id} bereits entschieden: {approval.status}")
            return approval

        if approval.expires_at and datetime.utcnow() > approval.expires_at:
            approval.status = ApprovalStatus.ABGELAUFEN
            await self.db.flush()
            return approval

        if decision == "genehmigt":
            approval.status = ApprovalStatus.GENEHMIGT
        else:
            approval.status = ApprovalStatus.ABGELEHNT

        approval.decided_by = decided_by
        approval.decided_at = datetime.utcnow()
        approval.decision_note = decision_note
        await self.db.flush()

        logger.info(f"Genehmigung {approval_id} entschieden: {decision} von {decided_by}")
        return approval

    async def get_pending_approvals(self) -> list[ApprovalRequest]:
        """Gibt alle ausstehenden Genehmigungen zurück."""
        result = await self.db.execute(
            select(ApprovalRequest).where(
                ApprovalRequest.status == ApprovalStatus.AUSSTEHEND
            ).order_by(ApprovalRequest.created_at.desc())
        )
        return list(result.scalars().all())

    async def expire_old_approvals(self) -> int:
        """Markiert abgelaufene Anfragen."""
        result = await self.db.execute(
            select(ApprovalRequest).where(
                ApprovalRequest.status == ApprovalStatus.AUSSTEHEND,
                ApprovalRequest.expires_at < datetime.utcnow(),
            )
        )
        expired = list(result.scalars().all())
        for approval in expired:
            approval.status = ApprovalStatus.ABGELAUFEN
        await self.db.flush()
        return len(expired)
