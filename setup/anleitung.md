# Einrichtungsanleitung – Zeitarbeit Rezeptionist

## Übersicht

Das System besteht aus **3 n8n Workflows** + einer **PostgreSQL-Datenbank** auf Hetzner.

```
WhatsApp ─┐
Telegram  ─┤→ [01 Kanal Router] → [02 KI Gehirn (Claude)] → Antwort
Chat      ─┤                              ↓ (wenn nötig)
E-Mail    ─┘                    [03 Genehmigung Gate] → E-Mail an Mitarbeiter
                                              ↓
                                   Mitarbeiter klickt: ✅ / ❌
                                              ↓
                                   Nutzer wird benachrichtigt
```

---

## Schritt 1: Hetzner Server vorbereiten

### PostgreSQL installieren (Ubuntu/Debian)

```bash
apt update && apt install -y postgresql postgresql-contrib
sudo -u postgres psql

# In psql:
CREATE USER zeitarbeit_user WITH PASSWORD 'SICHERES_PASSWORT_HIER';
CREATE DATABASE zeitarbeit_rezeptionist OWNER zeitarbeit_user;
GRANT ALL PRIVILEGES ON DATABASE zeitarbeit_rezeptionist TO zeitarbeit_user;
\q

# Schema einrichten
psql -U zeitarbeit_user -d zeitarbeit_rezeptionist -f /pfad/zu/database/schema.sql
```

### Firewall für n8n Cloud öffnen (Port 5432)

```bash
# Nur n8n Cloud IPs erlauben (aktuelle IPs: https://docs.n8n.io/hosting/supported-ip-addresses/)
ufw allow from REPLACE_N8N_IP to any port 5432
```

---

## Schritt 2: n8n Cloud einrichten

### Credentials erstellen (Settings → Credentials)

#### 1. Anthropic API Key (Claude Haiku)
- **Typ**: HTTP Header Auth
- **Name**: `Anthropic API Key`
- **Header Name**: `x-api-key`
- **Header Value**: `sk-ant-...` (von https://console.anthropic.com/)

#### 2. PostgreSQL (Hetzner)
- **Typ**: Postgres
- **Name**: `Hetzner PostgreSQL`
- **Host**: `IP-DEINES-HETZNER-SERVERS`
- **Port**: `5432`
- **Database**: `zeitarbeit_rezeptionist`
- **User**: `zeitarbeit_user`
- **Password**: `DEIN_SICHERES_PASSWORT`
- **SSL**: Aktivieren (empfohlen)

#### 3. SMTP (E-Mail senden)
- **Typ**: SMTP
- **Name**: `SMTP Ausgang`
- **Host**: `smtp.dein-anbieter.de`
- **Port**: `587` (STARTTLS) oder `465` (SSL)
- **User**: `maria@deinefirma.de`
- **Password**: `E-MAIL-PASSWORT`

#### 4. IMAP (E-Mails empfangen)
- **Typ**: IMAP
- **Name**: `IMAP Empfangs-Konto`
- **Host**: `imap.dein-anbieter.de`
- **Port**: `993`
- **User**: `empfang@deinefirma.de`
- **Password**: `E-MAIL-PASSWORT`

#### 5. WhatsApp Bearer Token
- **Typ**: HTTP Header Auth
- **Name**: `WhatsApp Bearer Token`
- **Header Name**: `Authorization`
- **Header Value**: `Bearer DEIN_WHATSAPP_TOKEN`
- (Token von Meta for Developers: https://developers.facebook.com/)

#### 6. Google Calendar OAuth2 (für Terminbuchung)
- **Typ**: Google OAuth2
- **Name**: `Google Calendar OAuth2`
- (Setup: https://docs.n8n.io/integrations/builtin/credentials/google/)

---

## Schritt 3: Umgebungsvariablen in n8n Cloud setzen

In n8n Cloud unter **Settings → Environment Variables**:

| Variable | Beschreibung | Beispiel |
|---|---|---|
| `FIRMA_NAME` | Name Ihrer Zeitarbeitsfirma | `Mustermann Personal GmbH` |
| `FIRMA_WEBSITE` | Website der Firma | `https://www.mustermann-personal.de` |
| `STAFF_EMAIL_PRIMARY` | Haupt-E-Mail für Genehmigungen | `leiter@mustermann-personal.de` |
| `STAFF_EMAIL_SECONDARY` | Backup-E-Mail (optional) | `stellvertretung@mustermann-personal.de` |
| `SMTP_FROM_EMAIL` | Absender-E-Mail von Maria | `maria@mustermann-personal.de` |
| `N8N_BASE_URL` | Ihre n8n Cloud URL | `https://ihre-instanz.app.n8n.cloud` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | `123456:ABC-DEF...` |
| `GOOGLE_CALENDAR_ID` | Google Kalender ID | `primary` oder `calendar-id@group.calendar.google.com` |

---

## Schritt 4: Workflows importieren und konfigurieren

### Reihenfolge beim Import (wichtig!)

1. **Zuerst `02-ki-gehirn.json` importieren** → Workflow-ID notieren!
2. Dann `03-genehmigung-gate.json` importieren
3. Zuletzt `01-haupt-kanal.json` importieren

### IDs aktualisieren (in 01-haupt-kanal.json)

Nach dem Import von `02-ki-gehirn.json` müssen Sie die Workflow-ID in `01-haupt-kanal.json` ersetzen:

1. In n8n: Öffnen Sie Workflow 02 (KI Gehirn) → kopieren Sie die ID aus der URL
2. In `01-haupt-kanal.json` ersetzen Sie **alle** Vorkommen von:
   `"value": "REPLACE_WITH_AI_BRAIN_WORKFLOW_ID"`
   mit der echten ID, z.B.:
   `"value": "AbCdEfGh12345678"`

### Credentials in den Workflows zuweisen

Nach dem Import jeden Workflow öffnen und bei allen Nodes die Credentials aus der Dropdown-Liste auswählen:
- Postgres Nodes → `Hetzner PostgreSQL`
- HTTP Request (Claude) → `Anthropic API Key`
- HTTP Request (WhatsApp) → `WhatsApp Bearer Token`
- Send Email / Email Read → `SMTP Ausgang` / `IMAP Empfangs-Konto`

---

## Schritt 5: Telegram Bot einrichten

```bash
# Telegram Bot erstellen:
# 1. Mit @BotFather auf Telegram schreiben
# 2. /newbot eingeben
# 3. Name und Username vergeben
# 4. Token kopieren → in n8n als TELEGRAM_BOT_TOKEN setzen

# Webhook für Bot setzen (ersetzen Sie BOTTOKEN und N8N_URL):
curl -X POST "https://api.telegram.org/botBOTTOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://IHRE_N8N_URL/webhook/rezeptionist-telegram"}'
```

---

## Schritt 6: WhatsApp Business API einrichten

1. Meta for Developers: https://developers.facebook.com/
2. App erstellen → WhatsApp → Business-Konto verknüpfen
3. Webhook URL setzen: `https://IHRE_N8N_URL/webhook/rezeptionist-whatsapp`
4. Verify Token setzen (beliebiger String, muss im n8n Webhook auch konfiguriert sein)
5. Felder abonnieren: `messages`
6. Access Token kopieren → in n8n Credential `WhatsApp Bearer Token` eintragen
7. Phone Number ID kopieren → wird automatisch aus dem Webhook-Payload gelesen

---

## Schritt 7: Chat-Widget in Website einbinden

Fügen Sie diesen Code kurz vor `</body>` in Ihre Website ein:

```html
<!-- Zeitarbeit Rezeptionist Chat Widget -->
<div id="chat-widget" style="position:fixed;bottom:20px;right:20px;z-index:9999;font-family:Arial,sans-serif;">
  <div id="chat-bubble" onclick="toggleChat()" style="width:60px;height:60px;background:#2c3e50;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
    <span style="font-size:28px;">💬</span>
  </div>
  <div id="chat-window" style="display:none;width:350px;height:500px;background:white;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.2);flex-direction:column;overflow:hidden;margin-bottom:10px;">
    <div style="background:#2c3e50;color:white;padding:16px;font-weight:bold;">
      🤖 Maria – Virtuelle Empfangsdame
      <span onclick="toggleChat()" style="float:right;cursor:pointer;">✕</span>
    </div>
    <div id="chat-messages" style="flex:1;overflow-y:auto;padding:16px;height:360px;"></div>
    <div style="padding:12px;border-top:1px solid #eee;display:flex;gap:8px;">
      <input id="chat-input" type="text" placeholder="Nachricht eingeben..." 
        style="flex:1;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;"
        onkeypress="if(event.key==='Enter')sendMessage()">
      <button onclick="sendMessage()" style="background:#2c3e50;color:white;border:none;padding:10px 16px;border-radius:6px;cursor:pointer;">➤</button>
    </div>
  </div>
</div>
<script>
const N8N_CHAT_URL = 'https://IHRE_N8N_URL/webhook/rezeptionist-chat';
let sessionId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

function toggleChat() {
  const win = document.getElementById('chat-window');
  win.style.display = win.style.display === 'none' ? 'flex' : 'none';
  win.style.flexDirection = 'column';
  if (win.style.display === 'flex' && document.getElementById('chat-messages').children.length === 0) {
    sendMessage('');
  }
}

function addMessage(text, isUser) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.style.cssText = `margin:8px 0;padding:10px 14px;border-radius:${isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px'};background:${isUser ? '#2c3e50' : '#f0f2f5'};color:${isUser ? 'white' : '#333'};max-width:80%;${isUser ? 'margin-left:auto' : ''};font-size:14px;line-height:1.4;white-space:pre-wrap;`;
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

async function sendMessage(customText) {
  const input = document.getElementById('chat-input');
  const text = customText !== undefined ? customText : input.value.trim();
  if (!text && customText === undefined) return;
  if (text) addMessage(text, true);
  if (input) input.value = '';
  try {
    const resp = await fetch(N8N_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, session_id: sessionId })
    });
    const data = await resp.json();
    if (data.reply) addMessage(data.reply, false);
  } catch(e) {
    addMessage('Verbindungsfehler. Bitte versuchen Sie es erneut.', false);
  }
}
</script>
```

---

## Schritt 8: Workflows aktivieren

Aktivieren in dieser Reihenfolge:
1. `03 – Genehmigung Gate` aktivieren ✅
2. `02 – KI Gehirn` aktivieren ✅
3. `01 – Kanal Router` aktivieren ✅

---

## Schritt 9: Testen

### WhatsApp Test
Schicken Sie eine Nachricht an Ihre WhatsApp Business Nummer.

### Telegram Test
Öffnen Sie Ihren Bot und schicken Sie `/start`.

### Chat Widget Test
Öffnen Sie Ihre Website und klicken Sie auf das Chat-Symbol.

### E-Mail Test
Schicken Sie eine E-Mail an die konfigurierte IMAP-Adresse.

### Genehmigung testen
1. Führen Sie eine komplette Bewerbung durch (alle Daten eingeben)
2. Sie sollten eine Genehmigungsmail bekommen
3. Klicken Sie ✅ GENEHMIGEN
4. Der Bewerber bekommt automatisch eine Bestätigungsmail

---

## Troubleshooting

### Claude antwortet kein JSON
→ In n8n beim Workflow 02 (KI Gehirn) den Schritt `🔍 Antwort parsen` prüfen.
→ Der Fallback in diesem Node gibt trotzdem eine Antwort zurück.

### PostgreSQL Verbindung schlägt fehl
→ Prüfen Sie ob Port 5432 in der Hetzner Firewall für n8n Cloud IPs freigegeben ist.
→ PostgreSQL `pg_hba.conf` prüfen: n8n Cloud IP erlauben.

### WhatsApp Webhook funktioniert nicht
→ Meta Webhook-Verification: Der n8n Webhook muss zuerst ein GET-Request für Verification beantworten. Ggf. in n8n einen separaten Verification-Webhook einrichten.

### Genehmigung-E-Mail kommt nicht an
→ SMTP Credentials prüfen, insbesondere ob Port 587/465 korrekt ist.
→ n8n Execution Logs prüfen (Settings → Executions).

---

## Kosten (monatlich, ca.)

| Dienst | Kosten |
|---|---|
| n8n Cloud (Starter) | ~20 €/Monat |
| Hetzner Server (CX21) | ~5 €/Monat |
| Claude Haiku API | ~1-5 €/Monat (je nach Volumen) |
| **Gesamt** | **~26-30 €/Monat** |

Claude Haiku kostet ca. 0,25 $ pro Million Input-Tokens – extrem günstig.

---

## Sicherheit

- ✅ Alle Daten auf deutschen Servern (Hetzner = DSGVO-konform)
- ✅ DSGVO-Einwilligung vor Datenspeicherung
- ✅ PostgreSQL über SSL gesichert
- ✅ Kein direkter Zugriff auf die Datenbank von außen
- ✅ Approval-Gate vor jeder wichtigen Aktion
- ⚠️ WhatsApp/Telegram Token sicher speichern (nur in n8n Credentials)
- ⚠️ n8n Webhook-URLs sind öffentlich – durch Token-Validierung absichern (optional)
