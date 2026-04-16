"""Kern des Sedik Recruiting-Agenten – Claude mit Tool Use."""

import json
import logging
from typing import Optional, AsyncIterator
from sqlalchemy.ext.asyncio import AsyncSession

import anthropic

from config import settings
from .prompts import SYSTEM_PROMPT
from .tools import AGENT_TOOLS
from services.applicant_service import ApplicantService
from services.job_order_service import JobOrderService
from services.appointment_service import AppointmentService
from services.qualification_service import QualificationService
from services.approval_service import ApprovalService
from services.email_service import EmailService
from services.phone_service import PhoneService

logger = logging.getLogger(__name__)


class RecruitmentAgent:
    """
    Sedik Recruiting Agent – Claude-gestützter Agent mit Human-in-the-Loop.
    Führt Gespräche, verwaltet Bewerber & Aufträge und holt Genehmigungen ein.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self._tenant_system_prompt: Optional[str] = None  # wird von außen gesetzt bei Tenant-Nutzung

        # Services initialisieren
        self.email_svc = EmailService()
        self.phone_svc = PhoneService()
        self.applicant_svc = ApplicantService(db)
        self.job_order_svc = JobOrderService(db)
        self.appointment_svc = AppointmentService(db)
        self.qualification_svc = QualificationService(db, self.client)
        self.approval_svc = ApprovalService(db, self.email_svc)

    async def chat(
        self,
        messages: list[dict],
        conversation_id: Optional[str] = None,
        max_iterations: int = 10,
    ) -> dict:
        """
        Führt einen Chat-Schritt aus und gibt Antwort + Tool-Ergebnisse zurück.
        Unterstützt mehrstufige Tool-Use-Loops.
        """
        iteration = 0
        current_messages = list(messages)

        while iteration < max_iterations:
            iteration += 1

            active_system = self._tenant_system_prompt or SYSTEM_PROMPT
            response = self.client.messages.create(
                model=settings.claude_model,
                max_tokens=4096,
                system=active_system,
                tools=AGENT_TOOLS,
                messages=current_messages,
            )

            logger.debug(f"Agent-Iteration {iteration}: stop_reason={response.stop_reason}")

            # Keine weiteren Tools nötig
            if response.stop_reason == "end_turn":
                text = self._extract_text(response)
                return {
                    "response": text,
                    "messages": current_messages,
                    "iterations": iteration,
                    "finished": True,
                }

            # Tool-Verwendung verarbeiten
            if response.stop_reason == "tool_use":
                tool_results = []
                assistant_content = response.content

                for block in response.content:
                    if block.type == "tool_use":
                        logger.info(f"Tool aufgerufen: {block.name} – Input: {json.dumps(block.input, ensure_ascii=False)[:200]}")
                        result = await self._execute_tool(block.name, block.input, conversation_id)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result, ensure_ascii=False, default=str),
                        })

                # Conversation weiterschreiben
                current_messages.append({"role": "assistant", "content": assistant_content})
                current_messages.append({"role": "user", "content": tool_results})
                continue

            # Unbekannter Stop-Reason
            break

        text = self._extract_text(response)
        return {
            "response": text or "Maximale Iterationstiefe erreicht.",
            "messages": current_messages,
            "iterations": iteration,
            "finished": False,
        }

    def _extract_text(self, response) -> str:
        """Extrahiert Text aus Claude-Response."""
        parts = []
        for block in response.content:
            if hasattr(block, "text"):
                parts.append(block.text)
        return " ".join(parts).strip()

    # ── Tool-Dispatcher ───────────────────────────────────────────────────────

    async def _execute_tool(self, tool_name: str, tool_input: dict, conversation_id: Optional[str]) -> dict:
        """Führt ein Tool aus und gibt das Ergebnis zurück."""
        try:
            match tool_name:
                case "create_applicant":
                    return await self._tool_create_applicant(tool_input)
                case "search_applicants":
                    return await self._tool_search_applicants(tool_input)
                case "get_applicant":
                    return await self._tool_get_applicant(tool_input)
                case "update_applicant":
                    return await self._tool_update_applicant(tool_input)
                case "check_qualification":
                    return await self._tool_check_qualification(tool_input)
                case "create_job_order":
                    return await self._tool_create_job_order(tool_input)
                case "search_job_orders":
                    return await self._tool_search_job_orders(tool_input)
                case "create_appointment":
                    return await self._tool_create_appointment(tool_input)
                case "send_interview_invitation":
                    return await self._tool_send_interview_invitation(tool_input)
                case "send_confirmation_email":
                    return await self._tool_send_confirmation_email(tool_input)
                case "send_custom_email":
                    return await self._tool_send_custom_email(tool_input)
                case "request_approval":
                    return await self._tool_request_approval(tool_input, conversation_id)
                case "escalate_to_staff":
                    return await self._tool_escalate_to_staff(tool_input, conversation_id)
                case "send_sms":
                    return await self._tool_send_sms(tool_input)
                case "get_pending_approvals":
                    return await self._tool_get_pending_approvals()
                case "get_upcoming_appointments":
                    return await self._tool_get_upcoming_appointments(tool_input)
                case _:
                    return {"error": f"Unbekanntes Tool: {tool_name}"}
        except Exception as e:
            logger.error(f"Tool-Fehler bei {tool_name}: {e}", exc_info=True)
            return {"error": str(e), "tool": tool_name}

    # ── Tool-Implementierungen ────────────────────────────────────────────────

    async def _tool_create_applicant(self, inp: dict) -> dict:
        applicant = await self.applicant_svc.create(inp)
        return {
            "success": True,
            "applicant_id": applicant.id,
            "message": f"Bewerber '{applicant.full_name}' erfolgreich angelegt.",
            "applicant": applicant.to_dict(),
        }

    async def _tool_search_applicants(self, inp: dict) -> dict:
        applicants = await self.applicant_svc.search(
            query=inp.get("query", ""),
            status=inp.get("status"),
            skill=inp.get("skill"),
            limit=inp.get("limit", 10),
        )
        return {
            "count": len(applicants),
            "applicants": [a.to_dict() for a in applicants],
        }

    async def _tool_get_applicant(self, inp: dict) -> dict:
        applicant = await self.applicant_svc.get(inp["applicant_id"])
        if not applicant:
            return {"error": "Bewerber nicht gefunden."}
        return {"applicant": applicant.to_dict()}

    async def _tool_update_applicant(self, inp: dict) -> dict:
        applicant = await self.applicant_svc.update(inp["applicant_id"], inp.get("updates", {}))
        if not applicant:
            return {"error": "Bewerber nicht gefunden."}
        return {"success": True, "applicant": applicant.to_dict()}

    async def _tool_check_qualification(self, inp: dict) -> dict:
        applicant = await self.applicant_svc.get(inp["applicant_id"])
        if not applicant:
            return {"error": "Bewerber nicht gefunden."}

        job_order = None
        if inp.get("job_order_id"):
            job_order = await self.job_order_svc.get(inp["job_order_id"])

        check = await self.qualification_svc.check_qualification(
            applicant=applicant,
            job_order=job_order,
            agent_analysis=inp.get("analysis"),
        )
        return {
            "success": True,
            "check_id": check.id,
            "overall_score": check.overall_score,
            "skill_match_score": check.skill_match_score,
            "passed": check.passed,
            "recommendation": check.recommendation,
            "strengths": json.loads(check.strengths) if check.strengths else [],
            "gaps": json.loads(check.gaps) if check.gaps else [],
            "message": "Qualifikationsprüfung abgeschlossen. Bitte Mitarbeiter-Bestätigung einholen.",
        }

    async def _tool_create_job_order(self, inp: dict) -> dict:
        order = await self.job_order_svc.create(inp)
        return {
            "success": True,
            "job_order_id": order.id,
            "message": f"Auftrag '{order.title}' für {order.company_name} angelegt.",
            "job_order": order.to_dict(),
        }

    async def _tool_search_job_orders(self, inp: dict) -> dict:
        orders = await self.job_order_svc.search(
            query=inp.get("query", ""),
            status=inp.get("status"),
            company=inp.get("company"),
        )
        return {
            "count": len(orders),
            "job_orders": [o.to_dict() for o in orders],
        }

    async def _tool_create_appointment(self, inp: dict) -> dict:
        from datetime import datetime
        if "scheduled_at" in inp and isinstance(inp["scheduled_at"], str):
            try:
                inp["scheduled_at"] = datetime.fromisoformat(inp["scheduled_at"])
            except ValueError:
                pass
        appt = await self.appointment_svc.create(inp)
        return {
            "success": True,
            "appointment_id": appt.id,
            "confirmation_token": appt.confirmation_token,
            "message": f"Termin '{appt.title}' angelegt. Noch keine Einladung gesendet.",
        }

    async def _tool_send_interview_invitation(self, inp: dict) -> dict:
        appt = await self.appointment_svc.get(inp["appointment_id"])
        if not appt:
            return {"error": "Termin nicht gefunden."}
        if not appt.applicant:
            applicant = await self.applicant_svc.get(appt.applicant_id)
        else:
            applicant = appt.applicant

        if not applicant or not applicant.email:
            return {"error": "Bewerber hat keine E-Mail-Adresse."}

        confirmation_link = (
            f"{settings.app_url}/api/appointments/{appt.id}/confirm"
            f"?token={appt.confirmation_token}"
        )

        scheduled_str = appt.scheduled_at.strftime("%d.%m.%Y") if appt.scheduled_at else "noch offen"
        time_str = appt.scheduled_at.strftime("%H:%M") if appt.scheduled_at else ""

        job_order = None
        if appt.job_order_id:
            job_order = await self.job_order_svc.get(appt.job_order_id)

        success = await self.email_svc.send_interview_invitation(
            to_email=applicant.email,
            applicant_name=applicant.full_name,
            position=job_order.title if job_order else appt.title,
            company=job_order.company_name if job_order else "unserem Unternehmen",
            date_str=scheduled_str,
            time_str=time_str,
            location=appt.location or "wird noch bekannt gegeben",
            interviewer_name=appt.interviewer_name or "unser Team",
            confirmation_link=confirmation_link,
            additional_notes=inp.get("additional_message", appt.notes or ""),
        )

        if success:
            from datetime import datetime
            appt.invitation_sent = True
            appt.invitation_sent_at = datetime.utcnow()
            appt.status = "eingeladen"
            await self.db.flush()
            return {"success": True, "message": f"Einladung an {applicant.email} gesendet."}
        return {"error": "E-Mail konnte nicht gesendet werden."}

    async def _tool_send_confirmation_email(self, inp: dict) -> dict:
        appt = await self.appointment_svc.get(inp["appointment_id"])
        if not appt:
            return {"error": "Termin nicht gefunden."}

        scheduled_str = appt.scheduled_at.strftime("%d.%m.%Y") if appt.scheduled_at else "offen"
        time_str = appt.scheduled_at.strftime("%H:%M") if appt.scheduled_at else ""

        success = await self.email_svc.send_appointment_confirmation(
            to_email=inp["to_email"],
            recipient_name=inp["recipient_name"],
            appointment_title=appt.title,
            date_str=scheduled_str,
            time_str=time_str,
            location=appt.location or "wird bekannt gegeben",
        )
        return {"success": success, "message": "Bestätigungs-E-Mail gesendet." if success else "Fehler."}

    async def _tool_send_custom_email(self, inp: dict) -> dict:
        success = await self.email_svc.send_custom_email(
            to_emails=inp["to_emails"],
            subject=inp["subject"],
            body=inp["body"],
        )
        return {"success": success}

    async def _tool_request_approval(self, inp: dict, conversation_id: Optional[str]) -> dict:
        approval = await self.approval_svc.request_approval(
            action_type=inp["action_type"],
            action_title=inp["action_title"],
            action_description=inp["action_description"],
            action_data=inp.get("action_data"),
            applicant_id=inp.get("applicant_id"),
            job_order_id=inp.get("job_order_id"),
            conversation_id=conversation_id,
        )
        return {
            "success": True,
            "approval_id": approval.id,
            "approval_token": approval.token,
            "status": approval.status.value,
            "message": (
                f"Genehmigungsanfrage '{inp['action_title']}' erstellt und Mitarbeiter benachrichtigt. "
                f"Warte auf Bestätigung (max. {settings.approval_timeout_hours}h). "
                f"Approval-ID: {approval.id}"
            ),
        }

    async def _tool_escalate_to_staff(self, inp: dict, conversation_id: Optional[str]) -> dict:
        staff_emails = settings.get_staff_email_list()
        sent = False

        if staff_emails:
            conversation_link = f"{settings.app_url}/conversations/{conversation_id}" if conversation_id else settings.app_url
            sent = await self.email_svc.send_staff_escalation(
                staff_emails=staff_emails,
                issue_title=inp["issue_title"],
                issue_description=inp["issue_description"],
                suggested_action=inp.get("suggested_action", "Bitte manuell prüfen."),
                conversation_link=conversation_link,
            )

        # SMS bei dringend
        if inp.get("urgency") == "dringend":
            for phone in settings.get_staff_phone_list():
                await self.phone_svc.send_staff_alert_sms(
                    phone,
                    f"[DRINGEND] {inp['issue_title']}: {inp['issue_description'][:100]}"
                )

        return {
            "success": True,
            "notification_sent": sent,
            "message": f"Eskalation '{inp['issue_title']}' an Mitarbeiter weitergeleitet.",
        }

    async def _tool_send_sms(self, inp: dict) -> dict:
        success = await self.phone_svc.send_sms(inp["to_phone"], inp["message"])
        return {"success": success}

    async def _tool_get_pending_approvals(self) -> dict:
        approvals = await self.approval_svc.get_pending_approvals()
        return {
            "count": len(approvals),
            "approvals": [a.to_dict() for a in approvals],
        }

    async def _tool_get_upcoming_appointments(self, inp: dict) -> dict:
        appointments = await self.appointment_svc.get_upcoming(inp.get("days", 7))
        return {
            "count": len(appointments),
            "appointments": [a.to_dict() for a in appointments],
        }
