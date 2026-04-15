"""REST-API für Mandantenverwaltung (Admin-Endpunkte)."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from services.tenant_service import TenantService
from services.gdpr_service import GdprService
from config import settings

router = APIRouter(prefix="/tenants", tags=["Mandanten (Admin)"])


def _require_admin(x_admin_key: str = Header(...)):
    """Einfacher Admin-Schutz über Header."""
    if x_admin_key != settings.secret_key:
        raise HTTPException(status_code=403, detail="Kein Zugriff.")
    return x_admin_key


class TenantCreate(BaseModel):
    company_name: str
    company_short: str           # Eindeutiger Kurzname, z.B. "mueller-personal"
    legal_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    data_protection_officer: Optional[str] = None
    data_protection_email: Optional[str] = None

    # Branding
    primary_color: str = "#1a56db"
    logo_url: Optional[str] = None

    # Agent
    agent_name: str = "Recruiting-Agent"
    agent_greeting: Optional[str] = None
    agent_persona: Optional[str] = None

    # E-Mail
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None      # wird verschlüsselt gespeichert
    email_from_name: Optional[str] = None
    email_from_address: Optional[str] = None
    email_signature: Optional[str] = None

    # Telefon
    phone_provider: str = "disabled"         # twilio | sipgate | placetel | sip_trunk | disabled
    business_phone_number: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None  # wird verschlüsselt gespeichert
    sip_domain: Optional[str] = None
    sip_username: Optional[str] = None
    sip_password: Optional[str] = None       # wird verschlüsselt gespeichert
    sipgate_token_id: Optional[str] = None
    sipgate_token: Optional[str] = None      # wird verschlüsselt gespeichert

    # Mitarbeiter
    staff_emails: Optional[str] = None
    staff_phones: Optional[str] = None
    approval_timeout_hours: int = 24

    # DSGVO
    data_retention_days: int = 730
    auto_anonymize_rejected: bool = True
    auto_anonymize_after_days: int = 180
    gdpr_consent_required: bool = True


class TenantUpdate(BaseModel):
    company_name: Optional[str] = None
    agent_name: Optional[str] = None
    agent_greeting: Optional[str] = None
    agent_persona: Optional[str] = None
    primary_color: Optional[str] = None
    staff_emails: Optional[str] = None
    staff_phones: Optional[str] = None
    approval_timeout_hours: Optional[int] = None
    smtp_password: Optional[str] = None
    business_phone_number: Optional[str] = None
    phone_provider: Optional[str] = None
    sip_domain: Optional[str] = None
    sip_username: Optional[str] = None
    sip_password: Optional[str] = None
    data_retention_days: Optional[int] = None
    auto_anonymize_rejected: Optional[bool] = None
    is_active: Optional[bool] = None


@router.get("/", dependencies=[Depends(_require_admin)])
async def list_tenants(db: AsyncSession = Depends(get_db)):
    svc = TenantService(db)
    tenants = await svc.get_all()
    return {"tenants": [t.to_dict() for t in tenants]}


@router.post("/", status_code=201, dependencies=[Depends(_require_admin)])
async def create_tenant(data: TenantCreate, db: AsyncSession = Depends(get_db)):
    svc = TenantService(db)
    existing = await svc.get_by_short(data.company_short)
    if existing:
        raise HTTPException(status_code=409, detail=f"Kurzname '{data.company_short}' bereits vergeben.")
    tenant = await svc.create(data.model_dump(exclude_none=True))
    return {
        "tenant": tenant.to_dict(include_secrets=True),
        "message": f"Mandant '{tenant.company_name}' angelegt. API-Key sicher aufbewahren!",
    }


@router.get("/{tenant_id}", dependencies=[Depends(_require_admin)])
async def get_tenant(tenant_id: str, db: AsyncSession = Depends(get_db)):
    svc = TenantService(db)
    tenant = await svc.get(tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Mandant nicht gefunden.")
    return tenant.to_dict(include_secrets=True)


@router.patch("/{tenant_id}", dependencies=[Depends(_require_admin)])
async def update_tenant(
    tenant_id: str, data: TenantUpdate, db: AsyncSession = Depends(get_db)
):
    svc = TenantService(db)
    tenant = await svc.update(tenant_id, data.model_dump(exclude_none=True))
    if not tenant:
        raise HTTPException(status_code=404, detail="Mandant nicht gefunden.")
    return {"tenant": tenant.to_dict(), "message": "Konfiguration aktualisiert."}


# ── DSGVO-Endpunkte ───────────────────────────────────────────────────────────

@router.get("/{tenant_id}/audit-log", dependencies=[Depends(_require_admin)])
async def get_audit_log(
    tenant_id: str,
    resource_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Audit-Log für einen Mandanten (DSGVO Art. 5 Abs. 2)."""
    svc = GdprService(db)
    logs = await svc.get_audit_log(resource_id=resource_id, limit=200)
    return {"logs": [l.to_dict() for l in logs]}


@router.post("/{tenant_id}/run-anonymization", dependencies=[Depends(_require_admin)])
async def run_anonymization(tenant_id: str, db: AsyncSession = Depends(get_db)):
    """Manueller Auslöser für automatische Anonymisierung."""
    from models.tenant import Tenant
    from sqlalchemy import select
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404)
    svc = GdprService(db)
    count = await svc.auto_anonymize_old_records(tenant.auto_anonymize_after_days)
    return {"anonymized_count": count, "message": f"{count} Bewerber anonymisiert."}
