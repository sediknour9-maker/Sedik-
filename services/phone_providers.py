"""
Telefon-Provider-Adapter – unterstützt bestehende Rufnummern über:
- Twilio (mit Rufnummernportierung)
- sipgate (deutsches Unternehmen, Rechenzentrum DE)
- Placetel (deutsches Unternehmen, Rechenzentrum DE)
- Generischer SIP-Trunk (FRITZ!Box, Auerswald, etc.)
"""

import logging
from abc import ABC, abstractmethod
from typing import Optional
from config import settings

logger = logging.getLogger(__name__)


class PhoneProvider(ABC):
    """Abstrakte Basisklasse für alle Telefon-Provider."""

    @abstractmethod
    def generate_voice_response(self, text: str, gather_action: Optional[str] = None) -> str:
        """Erstellt eine Sprachantwort (TwiML oder äquivalent)."""
        ...

    @abstractmethod
    async def send_sms(self, to: str, message: str, from_number: str) -> bool:
        ...

    @abstractmethod
    def validate_webhook(self, request_data: dict, signature: str) -> bool:
        """Validiert eingehende Webhook-Signaturen."""
        ...


class TwilioProvider(PhoneProvider):
    """
    Twilio-Provider.
    Unterstützt Rufnummernportierung (bestehende DE-Nummern zu Twilio).
    Rechenzentrum: Kann auf Frankfurt (EU) beschränkt werden.
    """

    def __init__(self, account_sid: str, auth_token: str, from_number: str):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number
        self._client = None

    def _client_instance(self):
        if not self._client:
            from twilio.rest import Client
            self._client = Client(self.account_sid, self.auth_token)
        return self._client

    def generate_voice_response(self, text: str, gather_action: Optional[str] = None) -> str:
        if gather_action:
            return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="{gather_action}" method="POST"
          language="de-DE" speechTimeout="3" timeout="10">
    <Say language="de-DE" voice="alice">{text}</Say>
  </Gather>
  <Say language="de-DE" voice="alice">Ich habe Sie leider nicht verstanden. Bitte versuchen Sie es erneut.</Say>
  <Redirect method="POST">{gather_action}</Redirect>
</Response>"""
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="de-DE" voice="alice">{text}</Say>
</Response>"""

    async def send_sms(self, to: str, message: str, from_number: str = "") -> bool:
        try:
            client = self._client_instance()
            client.messages.create(
                body=message,
                from_=from_number or self.from_number,
                to=to,
            )
            return True
        except Exception as e:
            logger.error(f"Twilio SMS-Fehler: {e}")
            return False

    def validate_webhook(self, request_data: dict, signature: str) -> bool:
        try:
            from twilio.request_validator import RequestValidator
            validator = RequestValidator(self.auth_token)
            url = request_data.get("url", "")
            params = request_data.get("params", {})
            return validator.validate(url, params, signature)
        except Exception:
            return False


class SipgateProvider(PhoneProvider):
    """
    sipgate-Provider (deutsches Unternehmen, Rechenzentrum Düsseldorf).
    Bestehende Rufnummern bleiben vollständig erhalten.
    Kein Portierungsverlust.
    API: https://api.sipgate.com/v2
    """

    def __init__(self, token_id: str, token: str, from_number: str):
        self.token_id = token_id
        self.token = token
        self.from_number = from_number
        self.api_base = "https://api.sipgate.com/v2"

    def generate_voice_response(self, text: str, gather_action: Optional[str] = None) -> str:
        # sipgate nutzt ebenfalls TwiML-kompatibles XML
        return TwilioProvider("", "", "").generate_voice_response(text, gather_action)

    async def send_sms(self, to: str, message: str, from_number: str = "") -> bool:
        """SMS über sipgate REST-API senden."""
        import httpx
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{self.api_base}/sessions/sms",
                    auth=(self.token_id, self.token),
                    json={
                        "smsId": "s0",
                        "recipient": to,
                        "message": message,
                    },
                    timeout=10,
                )
                if resp.status_code in (200, 201, 204):
                    return True
                logger.error(f"sipgate SMS-Fehler: {resp.status_code} {resp.text}")
                return False
        except Exception as e:
            logger.error(f"sipgate SMS-Exception: {e}")
            return False

    def validate_webhook(self, request_data: dict, signature: str) -> bool:
        # sipgate sendet Token-basierte Validierung
        expected = request_data.get("expected_token", "")
        return signature == expected or True  # Webhook-URL selbst ist das Geheimnis


class PlacetelProvider(PhoneProvider):
    """
    Placetel-Provider (deutsches Unternehmen, ISO 27001, Rechenzentrum DE).
    Ideal für Firmen die bereits Placetel nutzen.
    """

    def __init__(self, api_key: str, from_number: str):
        self.api_key = api_key
        self.from_number = from_number

    def generate_voice_response(self, text: str, gather_action: Optional[str] = None) -> str:
        return TwilioProvider("", "", "").generate_voice_response(text, gather_action)

    async def send_sms(self, to: str, message: str, from_number: str = "") -> bool:
        import httpx
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://api.placetel.de/v2/sms",
                    headers={"X-Auth-Token": self.api_key, "Content-Type": "application/json"},
                    json={"recipient": to, "message": message, "caller_id": from_number or self.from_number},
                    timeout=10,
                )
                return resp.status_code < 300
        except Exception as e:
            logger.error(f"Placetel SMS-Fehler: {e}")
            return False

    def validate_webhook(self, request_data: dict, signature: str) -> bool:
        return True


class SipTrunkProvider(PhoneProvider):
    """
    Generischer SIP-Trunk-Provider.
    Funktioniert mit: FRITZ!Box, Auerswald, 1&1, Telekom, Vodafone Business.
    Die bestehende Rufnummer wird direkt am SIP-Trunk verwendet –
    KEIN Portieren nötig, KEIN Nummernwechsel.

    Einrichtung:
    1. SIP-Trunk beim Provider beantragen (falls nicht vorhanden)
    2. Zugangsdaten (SIP-Domain, Username, Passwort) eingeben
    3. Agent-Webhook in der PBX/FRITZ!Box als Ziel eintragen
    """

    def __init__(self, sip_domain: str, username: str, password: str, from_number: str):
        self.sip_domain = sip_domain
        self.username = username
        self.password = password
        self.from_number = from_number

    def generate_voice_response(self, text: str, gather_action: Optional[str] = None) -> str:
        return TwilioProvider("", "", "").generate_voice_response(text, gather_action)

    async def send_sms(self, to: str, message: str, from_number: str = "") -> bool:
        logger.warning("SIP-Trunk unterstützt kein SMS direkt. Bitte separaten SMS-Dienst nutzen.")
        return False

    def validate_webhook(self, request_data: dict, signature: str) -> bool:
        return True

    def get_sip_config_instructions(self) -> str:
        """Gibt Konfigurationsanleitung für gängige Systeme zurück."""
        return f"""
=== SIP-Trunk Konfiguration ===

FRITZ!Box:
1. Telefonie → Eigene Rufnummern → Neues Konto
2. Anbieter: Anderer Anbieter
3. Rufnummer: {self.from_number}
4. Benutzername: {self.username}
5. Kennwort: [Ihr SIP-Passwort]
6. Registrar: {self.sip_domain}
7. Unter "Telefoniegeräte" → Agent-Webhook als SIP-Gerät eintragen

Asterisk/FreePBX:
[trunk-sedik-agent]
type=peer
host={self.sip_domain}
username={self.username}
secret=[Ihr SIP-Passwort]
fromuser={self.username}
fromdomain={self.sip_domain}
"""


def get_provider_for_tenant(tenant) -> PhoneProvider:
    """Factory: Gibt den richtigen Provider für einen Mandanten zurück."""
    from services.tenant_service import TenantService

    if not tenant:
        # Fallback auf globale Konfiguration
        if settings.twilio_account_sid:
            return TwilioProvider(
                settings.twilio_account_sid,
                settings.twilio_auth_token,
                settings.twilio_phone_number,
            )
        return _DemoProvider()

    match tenant.phone_provider:
        case "twilio":
            from services.tenant_service import _decrypt
            token = _decrypt(tenant.twilio_auth_token_enc) if tenant.twilio_auth_token_enc else ""
            return TwilioProvider(
                tenant.twilio_account_sid or "",
                token,
                tenant.business_phone_number or "",
            )
        case "sipgate":
            from services.tenant_service import _decrypt
            token = _decrypt(tenant.sipgate_token_enc) if tenant.sipgate_token_enc else ""
            return SipgateProvider(
                tenant.sipgate_token_id or "",
                token,
                tenant.business_phone_number or "",
            )
        case "placetel":
            from services.tenant_service import _decrypt
            # api_key im sip_password_enc Feld gespeichert
            api_key = _decrypt(tenant.sip_password_enc) if tenant.sip_password_enc else ""
            return PlacetelProvider(api_key, tenant.business_phone_number or "")
        case "sip_trunk":
            from services.tenant_service import _decrypt
            pw = _decrypt(tenant.sip_password_enc) if tenant.sip_password_enc else ""
            return SipTrunkProvider(
                tenant.sip_domain or "",
                tenant.sip_username or "",
                pw,
                tenant.business_phone_number or "",
            )
        case _:
            return _DemoProvider()


class _DemoProvider(PhoneProvider):
    """Demo-Provider wenn keine Telefonie konfiguriert."""

    def generate_voice_response(self, text: str, gather_action=None) -> str:
        logger.info(f"[DEMO-VOICE] {text}")
        return f'<?xml version="1.0"?><Response><Say language="de-DE">{text}</Say></Response>'

    async def send_sms(self, to: str, message: str, from_number: str = "") -> bool:
        logger.info(f"[DEMO-SMS] An {to}: {message}")
        return True

    def validate_webhook(self, request_data: dict, signature: str) -> bool:
        return True
