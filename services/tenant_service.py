"""Mandanten-Service – Konfiguration pro Zeitarbeitsfirma laden und verwalten."""

import base64
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.tenant import Tenant
from config import settings

logger = logging.getLogger(__name__)

# Einfache symmetrische Verschlüsselung für gespeicherte Passwörter
# In Produktion: HashiCorp Vault oder AWS Secrets Manager
def _encrypt(plain: str) -> str:
    """Basis-Verschlüsselung für DB-Geheimnisse (Base64 + XOR mit Secret)."""
    key = settings.secret_key.encode()
    data = plain.encode()
    encrypted = bytes(b ^ key[i % len(key)] for i, b in enumerate(data))
    return base64.b64encode(encrypted).decode()


def _decrypt(encrypted: str) -> str:
    key = settings.secret_key.encode()
    data = base64.b64decode(encrypted.encode())
    return bytes(b ^ key[i % len(key)] for i, b in enumerate(data)).decode()


class TenantService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> Tenant:
        """Neue Zeitarbeitsfirma anlegen."""
        # Passwörter verschlüsseln
        if "smtp_password" in data:
            data["smtp_password_enc"] = _encrypt(data.pop("smtp_password"))
        if "twilio_auth_token" in data:
            data["twilio_auth_token_enc"] = _encrypt(data.pop("twilio_auth_token"))
        if "sip_password" in data:
            data["sip_password_enc"] = _encrypt(data.pop("sip_password"))
        if "sipgate_token" in data:
            data["sipgate_token_enc"] = _encrypt(data.pop("sipgate_token"))

        tenant = Tenant(**{k: v for k, v in data.items() if hasattr(Tenant, k)})
        self.db.add(tenant)
        await self.db.flush()
        logger.info(f"Mandant angelegt: {tenant.company_short} ({tenant.company_name})")
        return tenant

    async def get(self, tenant_id: str) -> Optional[Tenant]:
        result = await self.db.execute(select(Tenant).where(Tenant.id == tenant_id))
        return result.scalar_one_or_none()

    async def get_by_short(self, company_short: str) -> Optional[Tenant]:
        result = await self.db.execute(
            select(Tenant).where(Tenant.company_short == company_short)
        )
        return result.scalar_one_or_none()

    async def get_by_api_key(self, api_key: str) -> Optional[Tenant]:
        result = await self.db.execute(
            select(Tenant).where(Tenant.api_key == api_key, Tenant.is_active == True)
        )
        return result.scalar_one_or_none()

    async def get_all(self) -> list[Tenant]:
        result = await self.db.execute(
            select(Tenant).where(Tenant.is_active == True).order_by(Tenant.company_name)
        )
        return list(result.scalars().all())

    async def update(self, tenant_id: str, data: dict) -> Optional[Tenant]:
        tenant = await self.get(tenant_id)
        if not tenant:
            return None
        # Passwörter verschlüsseln falls mitgeliefert
        if "smtp_password" in data:
            data["smtp_password_enc"] = _encrypt(data.pop("smtp_password"))
        if "twilio_auth_token" in data:
            data["twilio_auth_token_enc"] = _encrypt(data.pop("twilio_auth_token"))
        if "sip_password" in data:
            data["sip_password_enc"] = _encrypt(data.pop("sip_password"))

        for k, v in data.items():
            if hasattr(tenant, k) and k not in ("id", "created_at", "api_key"):
                setattr(tenant, k, v)
        await self.db.flush()
        return tenant

    def get_smtp_password(self, tenant: Tenant) -> str:
        """Entschlüsselt das SMTP-Passwort für einen Mandanten."""
        if not tenant.smtp_password_enc:
            return settings.smtp_password
        return _decrypt(tenant.smtp_password_enc)

    def get_twilio_token(self, tenant: Tenant) -> str:
        if not tenant.twilio_auth_token_enc:
            return settings.twilio_auth_token
        return _decrypt(tenant.twilio_auth_token_enc)

    def get_sip_password(self, tenant: Tenant) -> str:
        if not tenant.sip_password_enc:
            return ""
        return _decrypt(tenant.sip_password_enc)

    def get_sipgate_token(self, tenant: Tenant) -> str:
        if not tenant.sipgate_token_enc:
            return ""
        return _decrypt(tenant.sipgate_token_enc)

    def build_agent_system_prompt(self, tenant: Tenant, base_prompt: str) -> str:
        """Erstellt einen firmespezifischen System-Prompt."""
        additions = [
            f"\n## Firmeninformationen:",
            f"- Firmenname: {tenant.company_name}",
            f"- Agent-Name: {tenant.agent_name}",
        ]
        if tenant.agent_persona:
            additions.append(f"- Persönlichkeit: {tenant.agent_persona}")
        if tenant.agent_greeting:
            additions.append(f"- Standard-Begrüßung: \"{tenant.agent_greeting}\"")
        if tenant.city:
            additions.append(f"- Standort: {tenant.city}")
        if tenant.business_phone_number:
            additions.append(f"- Firmenrufnummer: {tenant.business_phone_number}")

        additions.append(
            f"\nDu heißt '{tenant.agent_name}' und arbeitest für '{tenant.company_name}'. "
            f"Nenne niemals andere Firmennamen."
        )

        return base_prompt + "\n" + "\n".join(additions)
