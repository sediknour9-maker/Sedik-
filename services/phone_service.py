"""Telefon-Service via Twilio für Anrufe und SMS."""

import logging
from typing import Optional
from config import settings

logger = logging.getLogger(__name__)


class PhoneService:
    """Verwaltet Twilio-Telefonie und SMS."""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            if not settings.twilio_account_sid or not settings.twilio_auth_token:
                logger.warning("Twilio nicht konfiguriert. Anrufe werden nur geloggt.")
                return None
            from twilio.rest import Client
            self._client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        return self._client

    async def send_sms(self, to_phone: str, message: str) -> bool:
        """SMS senden."""
        client = self._get_client()
        if not client:
            logger.info(f"[DEMO-SMS] An: {to_phone}\n{message}")
            return True
        try:
            msg = client.messages.create(
                body=message,
                from_=settings.twilio_phone_number,
                to=to_phone,
            )
            logger.info(f"SMS gesendet an {to_phone}: SID={msg.sid}")
            return True
        except Exception as e:
            logger.error(f"SMS-Fehler: {e}")
            return False

    async def send_appointment_reminder_sms(
        self, to_phone: str, applicant_name: str, date_str: str, time_str: str, location: str
    ) -> bool:
        """Terminerinnerungs-SMS."""
        message = (
            f"Hallo {applicant_name},\n"
            f"Erinnerung: Ihr Termin ist am {date_str} um {time_str} Uhr.\n"
            f"Ort: {location}\n"
            f"Sedik Recruiting"
        )
        return await self.send_sms(to_phone, message)

    async def send_staff_alert_sms(self, staff_phone: str, alert_message: str) -> bool:
        """Dringliche Benachrichtigung an Mitarbeiter per SMS."""
        message = f"[Sedik Agent] {alert_message}"
        return await self.send_sms(staff_phone, message)

    def make_call(self, to_phone: str, twiml_url: str) -> Optional[str]:
        """Ausgehenden Anruf initiieren (synchron für Twilio-Callbacks)."""
        client = self._get_client()
        if not client:
            logger.info(f"[DEMO-CALL] Anruf an {to_phone} mit TwiML: {twiml_url}")
            return "demo-call-sid"
        try:
            call = client.calls.create(
                to=to_phone,
                from_=settings.twilio_phone_number,
                url=twiml_url,
            )
            return call.sid
        except Exception as e:
            logger.error(f"Anruf-Fehler: {e}")
            return None

    def generate_twiml_response(self, text: str, gather_action: Optional[str] = None) -> str:
        """Erstellt TwiML für Sprachantworten."""
        gather_block = ""
        if gather_action:
            gather_block = f"""
    <Gather input="speech" action="{gather_action}" method="POST"
            language="de-DE" speechTimeout="3" timeout="10">
      <Say language="de-DE" voice="alice">{text}</Say>
    </Gather>
    <Say language="de-DE" voice="alice">Entschuldigung, ich habe Sie nicht verstanden. Bitte versuchen Sie es erneut.</Say>"""
        else:
            gather_block = f'<Say language="de-DE" voice="alice">{text}</Say>'

        return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
{gather_block}
</Response>"""

    def generate_hold_twiml(self, message: str) -> str:
        """TwiML für Warteschleife mit Übergabe-Ankündigung."""
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="de-DE" voice="alice">{message}</Say>
  <Play loop="3">https://demo.twilio.com/docs/classic.mp3</Play>
</Response>"""
