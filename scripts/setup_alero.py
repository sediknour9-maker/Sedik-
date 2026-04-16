"""
Einmaliges Setup-Skript für den Mandanten alero GmbH.
Führe es einmalig aus: python scripts/setup_alero.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import init_db, AsyncSessionLocal
from services.tenant_service import TenantService


ALERO_CONFIG = {
    # ── Firmendaten (von alero-gmbh.de) ───────────────────────────────────────
    "company_name":   "ALERO GmbH",
    "company_short":  "alero",
    "legal_name":     "ALERO Personaldienstleistung GmbH",
    "address":        "Mörikestraße 120",
    "city":           "Ludwigsburg",
    "postal_code":    "71636",
    "country":        "DE",
    "data_protection_officer": "Carmelina Gonnella",
    "data_protection_email":   "info@alero-gmbh.de",

    # ── Branding (abgestimmt auf alero-gmbh.de) ───────────────────────────────
    "primary_color":  "#C8281E",   # Alero Rot (aus Webseiten-Farbschema)
    "accent_color":   "#1a1a2e",   # Dunkelblau/Schwarz
    "logo_url":       "https://alero-gmbh.de/wp-content/uploads/alero-logo.png",

    # ── Agent-Konfiguration ───────────────────────────────────────────────────
    "agent_name":     "Alero Recruiting-Assistent",
    "agent_language": "de",
    "agent_greeting": (
        "Guten Tag! Sie sind verbunden mit dem Recruiting-Service der ALERO GmbH – "
        "Für die richtige Einstellung. Mein Name ist Alex, Ihr digitaler Ansprechpartner. "
        "Ich helfe Ihnen bei Bewerbungen, offenen Stellen und Terminvereinbarungen. "
        "Wie kann ich Ihnen heute helfen?"
    ),
    "agent_persona": (
        "Du arbeitest für ALERO GmbH in Ludwigsburg. "
        "Alero hat 15 Jahre Erfahrung in Zeitarbeit und Direktvermittlung. "
        "Branchen: Industrie, Logistik, Lager, kaufmännisch. "
        "Bereich: Großraum Ludwigsburg-Stuttgart. "
        "Slogan: 'Für die richtige Einstellung.' "
        "Sei freundlich, professionell und direkt. "
        "Du kennst die Region sehr gut (Ludwigsburg, Stuttgart, Böblingen, Heilbronn). "
        "Stelle NUR eine Frage auf einmal – überfordere den Bewerber nicht. "
        "Weise darauf hin, dass die Vermittlung für Bewerber kostenlos ist."
    ),

    # ── E-Mail (Platzhalter – mit echten Daten befüllen) ─────────────────────
    "email_from_name":    "ALERO GmbH – Recruiting",
    "email_from_address": "info@alero-gmbh.de",
    "email_signature": (
        "Mit freundlichen Grüßen\n"
        "ALERO GmbH – Für die richtige Einstellung.\n"
        "Mörikestraße 120 · 71636 Ludwigsburg\n"
        "Tel: +49 7141 913 11 80 · info@alero-gmbh.de\n"
        "www.alero-gmbh.de"
    ),

    # ── Telefon ───────────────────────────────────────────────────────────────
    # Vorhandene Rufnummer: +49 7141 913 11 80
    # Anbieter auswählen und Zugangsdaten eintragen:
    "phone_provider":         "disabled",   # → "sipgate", "twilio" oder "sip_trunk"
    "business_phone_number":  "+4971419131180",

    # ── Mitarbeiter für Genehmigungen ─────────────────────────────────────────
    # BITTE ANPASSEN: Echte Mitarbeiter-E-Mails eintragen
    "staff_emails":           "info@alero-gmbh.de",
    "staff_phones":           "+4971419131180",
    "approval_timeout_hours": 8,            # 8h Arbeitszeit

    # ── DSGVO ─────────────────────────────────────────────────────────────────
    "data_retention_days":       730,       # 2 Jahre (gesetzliche Grundlage)
    "auto_anonymize_rejected":   True,
    "auto_anonymize_after_days": 180,       # 6 Monate nach Ablehnung
    "gdpr_consent_required":     True,
}


async def main():
    print("── ALERO GmbH Setup ─────────────────────────────────")
    await init_db()

    async with AsyncSessionLocal() as session:
        svc = TenantService(session)

        # Prüfen ob bereits vorhanden
        existing = await svc.get_by_short("alero")
        if existing:
            print(f"✅ Mandant 'alero' existiert bereits. API-Key: {existing.api_key}")
            print(f"   Demo-URL: http://localhost:8000/demo/alero")
            return

        tenant = await svc.create(ALERO_CONFIG)
        await session.commit()

        print(f"✅ Mandant angelegt: {tenant.company_name}")
        print(f"")
        print(f"   API-Key:  {tenant.api_key}")
        print(f"   ID:       {tenant.id}")
        print(f"")
        print(f"   Demo-URL: http://localhost:8000/demo/alero")
        print(f"   Embed-Code für die Webseite:")
        print(f"")
        print(f'   <script src="http://localhost:8000/demo/alero/widget.js"></script>')
        print(f"")
        print(f"   ⚠️  Bitte noch anpassen in der Datenbank:")
        print(f"   - staff_emails: Echte Mitarbeiter-E-Mails")
        print(f"   - smtp_password: E-Mail-Passwort")
        print(f"   - phone_provider: sipgate/twilio/sip_trunk konfigurieren")
        print(f"─────────────────────────────────────────────────────")


if __name__ == "__main__":
    asyncio.run(main())
