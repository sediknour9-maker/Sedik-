"""E-Mail-Service für Bestätigungen, Einladungen und Benachrichtigungen."""

import logging
from typing import Optional, List
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from jinja2 import Environment, FileSystemLoader, select_autoescape
from config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.username = settings.smtp_username
        self.password = settings.smtp_password
        self.from_name = settings.smtp_from_name
        self.from_email = settings.smtp_from_email

        import os
        template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "email")
        self.jinja_env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(["html"]),
        )

    async def _send(self, to_emails: List[str], subject: str, html_body: str, text_body: str = "") -> bool:
        """Interne Methode zum E-Mail-Versand."""
        if not self.username or not self.from_email:
            logger.warning("E-Mail-Konfiguration fehlt. E-Mail wird nur geloggt.")
            logger.info(f"[DEMO-EMAIL] An: {to_emails} | Betreff: {subject}\n{text_body or html_body}")
            return True

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.from_name} <{self.from_email}>"
        msg["To"] = ", ".join(to_emails)

        if text_body:
            msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        try:
            await aiosmtplib.send(
                msg,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.username,
                password=self.password,
                start_tls=True,
            )
            logger.info(f"E-Mail gesendet an {to_emails}: {subject}")
            return True
        except Exception as e:
            logger.error(f"E-Mail-Fehler: {e}")
            return False

    def _render(self, template_name: str, context: dict) -> tuple[str, str]:
        """Rendert HTML- und Text-Template."""
        try:
            html_tpl = self.jinja_env.get_template(f"{template_name}.html")
            html = html_tpl.render(**context)
        except Exception:
            html = self._fallback_html(context.get("subject", ""), context.get("body", ""))

        try:
            txt_tpl = self.jinja_env.get_template(f"{template_name}.txt")
            text = txt_tpl.render(**context)
        except Exception:
            text = context.get("body", "")

        return html, text

    def _fallback_html(self, subject: str, body: str) -> str:
        return f"""
        <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#1a56db;padding:20px;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0">Sedik Recruiting</h1>
        </div>
        <div style="padding:20px;background:#f9fafb;border:1px solid #e5e7eb">
          <h2>{subject}</h2>
          <div style="white-space:pre-wrap">{body}</div>
        </div>
        <div style="padding:12px;text-align:center;color:#6b7280;font-size:12px">
          Sedik Recruiting Agent &mdash; Automatisch erstellt
        </div>
        </body></html>
        """

    # ─── Öffentliche Methoden ────────────────────────────────────────────────

    async def send_interview_invitation(
        self,
        to_email: str,
        applicant_name: str,
        position: str,
        company: str,
        date_str: str,
        time_str: str,
        location: str,
        interviewer_name: str,
        confirmation_link: str,
        additional_notes: str = "",
    ) -> bool:
        """Einladung zum Bewerbungsgespräch."""
        subject = f"Einladung zum Vorstellungsgespräch – {position} bei {company}"
        body = (
            f"Sehr geehrte/r {applicant_name},\n\n"
            f"wir freuen uns, Sie zu einem Vorstellungsgespräch für die Stelle '{position}' "
            f"bei {company} einzuladen.\n\n"
            f"Termin: {date_str} um {time_str} Uhr\n"
            f"Ort: {location}\n"
            f"Gesprächspartner: {interviewer_name}\n"
        )
        if additional_notes:
            body += f"\nHinweise: {additional_notes}\n"
        body += (
            f"\nBitte bestätigen Sie Ihre Teilnahme unter folgendem Link:\n{confirmation_link}\n\n"
            f"Bei Fragen stehen wir Ihnen gerne zur Verfügung.\n\n"
            f"Mit freundlichen Grüßen\nSedik Recruiting Team"
        )
        html, text = self._render("interview_invitation", {
            "subject": subject, "body": body,
            "applicant_name": applicant_name, "position": position,
            "company": company, "date_str": date_str, "time_str": time_str,
            "location": location, "interviewer_name": interviewer_name,
            "confirmation_link": confirmation_link, "additional_notes": additional_notes,
        })
        return await self._send([to_email], subject, html, text)

    async def send_appointment_confirmation(
        self,
        to_email: str,
        recipient_name: str,
        appointment_title: str,
        date_str: str,
        time_str: str,
        location: str,
    ) -> bool:
        """Terminbestätigung senden."""
        subject = f"Terminbestätigung: {appointment_title}"
        body = (
            f"Sehr geehrte/r {recipient_name},\n\n"
            f"Ihr Termin wurde bestätigt:\n\n"
            f"Termin: {appointment_title}\n"
            f"Datum: {date_str} um {time_str} Uhr\n"
            f"Ort: {location}\n\n"
            f"Wir freuen uns auf das Gespräch.\n\n"
            f"Mit freundlichen Grüßen\nSedik Recruiting Team"
        )
        html, text = self._render("appointment_confirmation", {
            "subject": subject, "body": body,
            "recipient_name": recipient_name, "appointment_title": appointment_title,
            "date_str": date_str, "time_str": time_str, "location": location,
        })
        return await self._send([to_email], subject, html, text)

    async def send_staff_approval_request(
        self,
        staff_emails: List[str],
        action_title: str,
        action_description: str,
        approval_link: str,
        rejection_link: str,
        context_info: str = "",
    ) -> bool:
        """Genehmigungsanfrage an Mitarbeiter."""
        subject = f"[Genehmigung erforderlich] {action_title}"
        body = (
            f"Der KI-Agent benötigt Ihre Genehmigung für folgende Aktion:\n\n"
            f"Aktion: {action_title}\n"
            f"Beschreibung: {action_description}\n"
        )
        if context_info:
            body += f"\nKontext:\n{context_info}\n"
        body += (
            f"\n✅ GENEHMIGEN: {approval_link}\n"
            f"❌ ABLEHNEN:   {rejection_link}\n\n"
            f"Diese Anfrage läuft in {settings.approval_timeout_hours} Stunden ab."
        )
        html, text = self._render("staff_approval", {
            "subject": subject, "body": body,
            "action_title": action_title, "action_description": action_description,
            "approval_link": approval_link, "rejection_link": rejection_link,
            "context_info": context_info, "timeout_hours": settings.approval_timeout_hours,
        })
        return await self._send(staff_emails, subject, html, text)

    async def send_staff_escalation(
        self,
        staff_emails: List[str],
        issue_title: str,
        issue_description: str,
        suggested_action: str,
        conversation_link: str,
    ) -> bool:
        """Eskalation bei Komplikationen an Mitarbeiter."""
        subject = f"[Eskalation] {issue_title}"
        body = (
            f"Der KI-Agent hat eine Situation erkannt, die Ihre Aufmerksamkeit erfordert:\n\n"
            f"Problem: {issue_title}\n"
            f"Beschreibung: {issue_description}\n\n"
            f"Vorgeschlagene Vorgehensweise:\n{suggested_action}\n\n"
            f"Gesprächsverlauf: {conversation_link}"
        )
        html, text = self._render("staff_escalation", {
            "subject": subject, "body": body,
            "issue_title": issue_title, "issue_description": issue_description,
            "suggested_action": suggested_action, "conversation_link": conversation_link,
        })
        return await self._send(staff_emails, subject, html, text)

    async def send_applicant_rejection(
        self, to_email: str, applicant_name: str, position: str, company: str, reason: str = ""
    ) -> bool:
        """Absagemail an Bewerber."""
        subject = f"Ihre Bewerbung als {position}"
        body = (
            f"Sehr geehrte/r {applicant_name},\n\n"
            f"vielen Dank für Ihr Interesse an der Stelle '{position}' bei {company}.\n\n"
            f"Nach sorgfältiger Prüfung müssen wir Ihnen leider mitteilen, dass wir "
            f"Ihre Bewerbung nicht weiterverfolgen können."
        )
        if reason:
            body += f"\n\n{reason}"
        body += (
            f"\n\nWir wünschen Ihnen für Ihre weitere Jobsuche alles Gute.\n\n"
            f"Mit freundlichen Grüßen\nSedik Recruiting Team"
        )
        html, text = self._render("applicant_rejection", {
            "subject": subject, "body": body,
            "applicant_name": applicant_name, "position": position, "company": company,
        })
        return await self._send([to_email], subject, html, text)

    async def send_custom_email(
        self, to_emails: List[str], subject: str, body: str
    ) -> bool:
        """Benutzerdefinierte E-Mail senden."""
        html = self._fallback_html(subject, body)
        return await self._send(to_emails, subject, html, body)
