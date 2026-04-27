# 🤖 Zeitarbeit Rezeptionist – Vollautomatisch auf n8n

Ein vollständiger, KI-gesteuerter Rezeptionist für Zeitarbeitsfirmen – gebaut auf n8n Cloud mit Claude Haiku, PostgreSQL auf Hetzner und DSGVO-konformer Datenspeicherung.

## Was das System kann

| Funktion | Beschreibung |
|---|---|
| **Multi-Kanal** | WhatsApp, Telegram, Chat-Widget, E-Mail gleichzeitig |
| **Doppelte Zielgruppe** | Bewerber UND Unternehmen werden erkannt und bedient |
| **Daten sammeln** | Schrittweise Erfassung aller relevanten Bewerberdaten |
| **Vorqualifizierung** | KI prüft Eignung anhand definierter Kriterien |
| **FAQ** | Beantwortet häufige Fragen zur Zeitarbeit automatisch |
| **Terminbuchung** | Freie Slots aus Google Calendar abrufen und buchen |
| **DSGVO** | Einwilligung wird vor jeder Datenspeicherung eingeholt |
| **Mitarbeiter-Freigabe** | Bei jeder wichtigen Aktion → E-Mail → Genehmigen / Ablehnen |

## Systemarchitektur

```
┌─────────────────────────────────────────────────────────┐
│                    EINGEHENDE KANÄLE                    │
│  📱 WhatsApp  ✈️ Telegram  💬 Chat-Widget  📧 E-Mail   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│        01 – KANAL ROUTER (Normalisierung)               │
│   Erkennt Kanal, normalisiert Nachrichtenformat         │
└─────────────────────┬───────────────────────────────────┘
                      │ ExecuteWorkflow (synchron)
                      ▼
┌─────────────────────────────────────────────────────────┐
│         02 – KI GEHIRN (Claude Haiku)                  │
│  Session Upsert → History laden → Prompt → Claude API  │
│  → Antwort parsen → Daten speichern → Aktion routen    │
└──────────┬──────────────────────────┬───────────────────┘
           │ Genehmigung nötig        │ Normal
           ▼                          ▼
┌─────────────────────┐    Antwort zurück an Kanal
│   03 – GENEHMIGUNGS │
│       GATE          │
│  Token → E-Mail     │
│  Warte (72h max)    │
│  Genehmigt?         │
│  Nutzer benachr.    │
└─────────────────────┘
           │
     Alle Daten in:
┌─────────────────────┐
│  PostgreSQL         │
│  (Hetzner Server)   │
│  DSGVO-konform DE   │
└─────────────────────┘
```

## Dateien

```
├── workflows/
│   ├── 01-haupt-kanal.json      ← Alle Eingabekanäle
│   ├── 02-ki-gehirn.json        ← KI Konversations-Engine
│   └── 03-genehmigung-gate.json ← Mitarbeiter-Freigabe
├── prompts/
│   └── system-prompt-de.md      ← Vollständiger KI-Prompt
├── database/
│   └── schema.sql               ← PostgreSQL Datenbankschema
└── setup/
    └── anleitung.md             ← Komplette Einrichtungsanleitung
```

## Schnellstart

1. PostgreSQL auf Hetzner einrichten → `database/schema.sql` einspielen
2. n8n Cloud Credentials konfigurieren (Anthropic, PostgreSQL, SMTP, IMAP)
3. Workflows importieren: zuerst 02, dann 03, dann 01
4. Umgebungsvariablen setzen (FIRMA_NAME, STAFF_EMAIL_PRIMARY, etc.)
5. Workflow-ID von 02-ki-gehirn in 01-haupt-kanal.json eintragen
6. Alle Workflows aktivieren

Komplette Anleitung: `setup/anleitung.md`

## KI-Modell

**Claude Haiku** (`claude-haiku-4-5-20251001`) – das effizienteste Modell:
- Blitzschnell (unter 2 Sekunden Antwortzeit)
- Extrem günstig (ca. 0,25 Dollar pro Million Tokens)
- Exzellentes Deutsch
- Perfekt für strukturierte Konversationen

## Genehmigungsablauf

KI sammelt alle Daten → Mitarbeiter bekommt E-Mail mit Daten-Zusammenfassung
→ Mitarbeiter klickt GENEHMIGEN oder ABLEHNEN (Link im E-Mail)
→ Nutzer wird automatisch benachrichtigt
→ Status in Datenbank aktualisiert

## Kosten (monatlich, ca.)

- n8n Cloud Starter: ca. 20 Euro
- Hetzner CX21: ca. 5 Euro
- Claude Haiku API: ca. 1-5 Euro
- Gesamt: ca. 26-30 Euro pro Monat
