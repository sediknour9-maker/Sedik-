# Sedik Recruiting Agent – Schritt-für-Schritt Bedienungsanleitung

---

## SCHRITT 1: Einmalige Einrichtung (einmal machen, dann fertig)

### 1.1 Programm installieren

```bash
# Terminal öffnen, in den Projektordner wechseln
cd Sedik-

# Python-Umgebung erstellen und aktivieren
python -m venv venv
source venv/bin/activate        # Linux/Mac
# ODER: venv\Scripts\activate   # Windows

# Abhängigkeiten installieren
pip install -r requirements.txt
```

### 1.2 Konfigurationsdatei anlegen

```bash
# Vorlage kopieren
cp .env.example .env

# .env mit Texteditor öffnen und ausfüllen
```

**Mindestangaben in der .env:**
```
ANTHROPIC_API_KEY=sk-ant-...        ← Von https://console.anthropic.com
STAFF_EMAILS=ihr-name@firma.de      ← Ihre E-Mail für Genehmigungen
SECRET_KEY=irgendein-langer-satz    ← Beliebiger geheimer Text (mind. 32 Zeichen)
```

### 1.3 Programm starten

```bash
python main.py
```

→ Das Dashboard öffnet sich unter: **http://localhost:8000**  
→ API-Dokumentation unter: **http://localhost:8000/docs**

---

## SCHRITT 2: Ihre Firma konfigurieren (Multi-Tenant)

> Falls Sie mehrere Zeitarbeitsfirmen betreiben oder das System für verschiedene
> Kunden nutzen möchten, legen Sie für jede Firma einen eigenen Mandanten an.

### 2.1 Neue Firma anlegen (via API)

Öffnen Sie **http://localhost:8000/docs** → `POST /api/tenants/`

Header setzen: `X-Admin-Key: [Ihr SECRET_KEY aus der .env]`

Beispiel-Konfiguration:
```json
{
  "company_name": "Müller Personal GmbH",
  "company_short": "mueller-personal",
  "legal_name": "Müller Personal GmbH & Co. KG",
  "address": "Musterstraße 1",
  "city": "Düsseldorf",
  "postal_code": "40210",
  "data_protection_officer": "Max Mustermann",
  "data_protection_email": "datenschutz@mueller-personal.de",

  "agent_name": "Lisa",
  "agent_greeting": "Guten Tag, Sie sind verbunden mit dem Recruiting-Service der Müller Personal GmbH. Mein Name ist Lisa. Wie kann ich Ihnen helfen?",
  "agent_persona": "Freundlich, professionell, Schwerpunkt Industrie und Logistik",
  "primary_color": "#2563eb",

  "email_from_name": "Lisa – Müller Personal",
  "email_from_address": "recruiting@mueller-personal.de",
  "smtp_host": "smtp.mueller-personal.de",
  "smtp_username": "recruiting@mueller-personal.de",
  "smtp_password": "IhrEmailPasswort",

  "staff_emails": "chef@mueller-personal.de,sachbearbeiter@mueller-personal.de",
  "staff_phones": "+4921112345678",
  "approval_timeout_hours": 8,

  "data_retention_days": 730,
  "auto_anonymize_rejected": true,
  "auto_anonymize_after_days": 180
}
```

**→ Sie erhalten einen API-Key zurück. Diesen sicher aufbewahren!**

### 2.2 Bestehende Rufnummer einrichten

Wählen Sie Ihren Anbieter:

#### Option A: sipgate (empfohlen – deutsches Rechenzentrum)
```json
{
  "phone_provider": "sipgate",
  "business_phone_number": "+492111234567",
  "sipgate_token_id": "xxxxx",
  "sipgate_token": "IhrSipgateToken"
}
```
**Einrichtung sipgate:**
1. Auf https://app.sipgate.com anmelden
2. → Einstellungen → Personal Access Token → Neu erstellen
3. Scope: `sessions:calls:write, sessions:sms:write`
4. Token-ID und Token in obige Felder eintragen
5. In sipgate → Routing → Eingehende Anrufe → Webhook-URL eintragen:
   `https://ihre-domain.de/api/phone/incoming`

#### Option B: Twilio mit bestehender Nummer (Portierung)
```json
{
  "phone_provider": "twilio",
  "business_phone_number": "+492111234567",
  "twilio_account_sid": "ACxxxx",
  "twilio_auth_token": "IhrTwilioToken"
}
```
**Rufnummernportierung zu Twilio:**
1. Twilio-Account erstellen: https://twilio.com
2. → Phone Numbers → Port a Number
3. Ihre bestehende Nummer eingeben und Portierungsformular ausfüllen
4. Dauer: 4–10 Werktage
5. Nach Portierung: Webhook in Twilio-Konsole setzen

#### Option C: SIP-Trunk (Nummer bleibt beim alten Anbieter)
```json
{
  "phone_provider": "sip_trunk",
  "business_phone_number": "+492111234567",
  "sip_domain": "sip.ihranbieter.de",
  "sip_username": "IhrSIPBenutzername",
  "sip_password": "IhrSIPPasswort"
}
```
**Funktioniert mit:** FRITZ!Box, Telekom, Vodafone Business, 1&1, Auerswald  
**Vorteil:** Nummer bleibt wo sie ist, kein Portieren nötig!

---

## SCHRITT 3: Tägliche Bedienung

### 3.1 Chat-Interface (einfachste Methode)

Öffnen Sie **http://localhost:8000** – das Chat-Dashboard ist sofort bereit.

**Beispiel-Befehle:**

| Was Sie sagen | Was der Agent tut |
|---|---|
| `"Neuer Bewerber: Max Müller, Elektriker, 5 Jahre, Tel: +49123..."` | Bewerber erfassen → Sie bestätigen |
| `"Prüf Max Müller gegen Auftrag Bosch Lager"` | Qualifikation prüfen → Score & Empfehlung |
| `"Leg Auftrag an: Bosch braucht 3 Gabelstapler ab 01.06."` | Auftrag anlegen → Sie bestätigen |
| `"Lad Max Müller zum Gespräch ein, Dienstag 10 Uhr"` | Einladungsmail → Sie bestätigen → Mail geht raus |
| `"Ruf Max Müller an und frag ob er noch verfügbar ist"` | Agent macht Anruf (falls Telefon konfiguriert) |
| `"Zeig alle offenen Aufträge"` | Liste aller offenen Stellen |
| `"Wer hat morgen Termin?"` | Übersicht bevorstehender Termine |

### 3.2 Genehmigungen (Human-in-the-Loop)

**So funktioniert es:**
1. Agent plant Aktion (z.B. Einladung senden)
2. **Sie bekommen eine E-Mail** mit ✅ und ❌ Button
3. Sie klicken → Aktion wird ausgeführt oder gestoppt
4. Agent meldet das Ergebnis

**Genehmigungsübersicht:** http://localhost:8000/api/approvals/

> **Wichtig:** Ohne Ihre Genehmigung passiert nichts Kritisches!
> Der Agent wartet immer auf Ihre Bestätigung.

### 3.3 Eskalationen

Wenn der Agent unsicher ist oder etwas Ungewöhnliches passiert:
- Sie bekommen automatisch eine **Eskalations-E-Mail**
- Bei "dringend": zusätzlich **SMS**
- Im Chat sehen Sie den Hinweis sofort

---

## SCHRITT 4: Telefon in Betrieb nehmen

### 4.1 Lokal testen (ohne öffentliche Domain)

```bash
# ngrok installieren: https://ngrok.com
ngrok http 8000
# → Sie bekommen eine temporäre URL wie: https://abc123.ngrok.io
```

Diese URL in sipgate/Twilio als Webhook eintragen:
`https://abc123.ngrok.io/api/phone/incoming`

### 4.2 Produktion (feste Domain)

```bash
# Mit eigenem Server + nginx:
# nginx.conf
server {
    listen 443 ssl;
    server_name agent.ihre-firma.de;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

In der .env: `APP_URL=https://agent.ihre-firma.de`

### 4.3 Anrufablauf

```
Jemand ruft Ihre Nummer an
        ↓
Agent meldet sich: "Guten Tag, hier ist [Firmenname]..."
        ↓
Bewerber nennt Anliegen (Sprache wird erkannt)
        ↓
Agent antwortet, fragt nach, erfasst Daten
        ↓
Bei komplexen Themen: "Ich verbinde Sie mit einem Mitarbeiter"
        ↓
Sie bekommen Benachrichtigung + Gesprächsprotokoll
```

---

## SCHRITT 5: DSGVO-konforme Datenverwaltung

### 5.1 Datenspeicherung in Deutschland

**Für DSGVO-konforme Speicherung empfohlene Hosting-Optionen:**

| Anbieter | Standort | Zertifizierung |
|---|---|---|
| **Hetzner** | Deutschland | ISO 27001 |
| **IONOS** | Deutschland | ISO 27001 |
| **OVH** | Straßburg FR | ISO 27001 |
| **Deutsche Telekom** | Deutschland | C5 BSI |
| **STACKIT** (Schwarz) | Deutschland | ISO 27001 |

**Datenbank auf deutschem Server hosten:**
```env
# In .env:
DATABASE_URL=postgresql+asyncpg://user:pass@ihr-de-server/sedik_db
```

### 5.2 Bewerber-Einwilligung einholen

Der Agent fragt beim ersten Gespräch automatisch:
> *"Darf ich Ihre Daten für die Stellenvermittlung speichern?
> (Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO)"*

Die Einwilligung wird mit Zeitstempel gespeichert.

### 5.3 Auskunftsrecht (Art. 15 DSGVO)

Bewerber kann jederzeit alle Daten anfordern:
```
GET /api/gdpr/applicants/{ID}/export
```

→ Gibt vollständigen Datenauszug als JSON zurück

### 5.4 Löschrecht (Art. 17 DSGVO)

```
POST /api/gdpr/applicants/{ID}/delete-request
```

→ Sie bekommen Benachrichtigung → bestätigen → Daten werden anonymisiert

### 5.5 Automatische Bereinigung

In der Mandanten-Konfiguration einstellbar:
```json
{
  "data_retention_days": 730,        ← Datenlöschung nach 2 Jahren
  "auto_anonymize_rejected": true,   ← Abgelehnte automatisch anonymisieren
  "auto_anonymize_after_days": 180   ← Nach 6 Monaten automatisch
}
```

### 5.6 Audit-Log einsehen

```
GET /api/tenants/{ID}/audit-log
```

Lückenlose Protokollierung aller Aktionen für den Datenschutzbeauftragten.

---

## Häufige Fragen

**F: Was kostet der Betrieb?**
- Anthropic Claude: ca. 0,003 € pro Gespräch
- Twilio/sipgate: ca. 0,01–0,05 € pro Gesprächsminute
- Server (Hetzner): ab 4 € / Monat

**F: Kann der Agent Fehler machen?**
- Ja – deshalb bestätigen SIE immer vor kritischen Aktionen
- Der Agent kann keine Verträge abschließen ohne Ihre Zustimmung

**F: Wie sichere ich die Daten?**
- Tägliches Backup der SQLite-Datei oder PostgreSQL-Backups
- Datenbank liegt ausschließlich auf Ihrem Server

**F: Kann ich mehrere Firmen gleichzeitig betreiben?**
- Ja! Jeder Mandant hat eigene Konfiguration, eigene Rufnummer, eigene E-Mail
- Daten sind vollständig getrennt

**F: Was wenn der Agent nicht mehr antwortet?**
- Server neu starten: `python main.py`
- Logs prüfen im Terminal
- API-Schlüssel prüfen in der .env

---

## Notfall-Kontakt

Bei technischen Problemen:
- Logs: Terminal-Ausgabe beim Start
- API-Status: http://localhost:8000/health
- Ausstehende Genehmigungen: http://localhost:8000/api/approvals/
