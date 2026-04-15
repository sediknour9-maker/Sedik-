# Sedik – KI-Recruiting-Agent für Zeitarbeitsfirmen

Ein vollständiger KI-Agent auf Basis von **Claude claude-sonnet-4-6** (Anthropic), der alle zentralen Aufgaben eines Recruiting-Sachbearbeiters in Zeitarbeitsfirmen übernimmt – immer mit **Human-in-the-Loop**.

## Funktionen

| Funktion | Beschreibung |
|---|---|
| **Bewerber anlegen** | Vollständige Erfassung mit Kontaktdaten, Skills, Erfahrung |
| **Qualifikation prüfen** | KI-gestützte Eignungsprüfung gegen offene Stellen (Score 0–100) |
| **Aufträge anlegen** | Stellenanfragen von Kundenunternehmen erfassen |
| **Gespräch einladen** | Automatische Einladungs-E-Mails mit Bestätigungslink |
| **Telefon** | Eingehende Anrufe entgegennehmen via Twilio (TTS + STT) |
| **Termine vereinbaren** | Kalender-Terminverwaltung mit Erinnerungen |
| **Bestätigungsmails** | Professionelle E-Mails für alle Vorgänge |
| **Eskalation** | Automatische Weiterleitung an Mitarbeiter bei Komplikationen |
| **Human-in-the-Loop** | Jede kritische Aktion benötigt Mitarbeiter-Genehmigung |

## Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    Sedik Agent                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Claude   │  │  Tools   │  │ HITL     │             │
│  │  claude-sonnet-4-6│  │  14 Stk. │  │ Approval │             │
│  └──────────┘  └──────────┘  └──────────┘             │
├─────────────────────────────────────────────────────────┤
│  Services: E-Mail │ Telefon (Twilio) │ Datenbank        │
├─────────────────────────────────────────────────────────┤
│  FastAPI REST-API + Web-Dashboard                       │
└─────────────────────────────────────────────────────────┘
```

## Schnellstart

### 1. Installation

```bash
git clone <repo-url>
cd Sedik-
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Konfiguration

```bash
cp .env.example .env
# .env mit echten Werten befüllen
```

Mindestanforderung:
```env
ANTHROPIC_API_KEY=sk-ant-...
STAFF_EMAILS=ihr-name@firma.de
```

### 3. Starten

```bash
python main.py
# oder
uvicorn main:app --reload
```

→ Dashboard: http://localhost:8000  
→ API-Docs: http://localhost:8000/docs

## Human-in-the-Loop Workflow

```
Agent plant Aktion
      ↓
request_approval() → E-Mail an Mitarbeiter
      ↓
Mitarbeiter klickt ✅ oder ❌ im E-Mail-Link
      ↓
Nach Genehmigung: Aktion wird ausgeführt
      ↓
Bei Ablehnung: Agent informiert und wartet auf Anweisung
```

**Genehmigungspflichtige Aktionen:**
- Bewerber endgültig anlegen
- Qualifikation als bestanden markieren
- Stellenauftrag anlegen
- Einladung zum Gespräch versenden
- Absage versenden
- Termin beim Kunden vereinbaren

## Twilio-Telefon einrichten

1. Twilio-Account erstellen und Nummer kaufen
2. `.env` mit Twilio-Credentials befüllen
3. Webhook in Twilio-Konsole setzen:
   - **Incoming Voice**: `https://ihre-domain.de/api/phone/incoming`
   - **Status Callback**: `https://ihre-domain.de/api/phone/status/{CallSid}`
4. Für lokale Entwicklung: [ngrok](https://ngrok.com/) verwenden

## API-Endpunkte

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| POST | `/api/agent/chat` | Nachricht an Agent senden |
| GET | `/api/applicants/` | Bewerber auflisten |
| POST | `/api/applicants/` | Bewerber anlegen |
| GET | `/api/job-orders/` | Aufträge auflisten |
| GET | `/api/appointments/upcoming` | Bevorstehende Termine |
| GET | `/api/approvals/` | Ausstehende Genehmigungen |
| GET | `/api/approvals/{id}/decide` | Genehmigung per Link |
| POST | `/api/phone/incoming` | Twilio-Webhook Eingehend |

## Beispiel-Chat

```
Mitarbeiter: "Neuer Bewerber: Max Mustermann, Elektriker, 5 Jahre Erfahrung, Telefon +49123456789"

Agent: Ich erfasse Max Mustermann als neuen Bewerber. Bevor ich ihn anlege, 
       benötige ich Ihre Genehmigung. Ich habe eine Anfrage an Sie gesendet.
       [Genehmigungsanfrage erstellt → E-Mail an Mitarbeiter]

Mitarbeiter: [klickt ✅ in E-Mail]

Agent: Max Mustermann wurde erfolgreich angelegt (ID: abc-123).
       Möchten Sie ihn direkt gegen einen offenen Auftrag prüfen?
```

## Technologie-Stack

- **KI**: Anthropic Claude claude-sonnet-4-6 mit Tool Use
- **Backend**: FastAPI + SQLAlchemy (async)
- **Datenbank**: SQLite (Produktion: PostgreSQL)
- **Telefon**: Twilio (Voice + SMS)
- **E-Mail**: SMTP / aiosmtplib
- **Templates**: Jinja2

## Lizenz

MIT
