"""Sedik AI Recruiting Agent – FastAPI Hauptanwendung."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from config import settings
from database import init_db
from api.routes import agent, applicants, job_orders, appointments, approvals, phone

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup und Shutdown-Events."""
    logger.info(f"🚀 {settings.app_name} startet...")
    await init_db()
    logger.info("✅ Datenbank initialisiert.")
    yield
    logger.info("👋 Anwendung wird beendet.")


app = FastAPI(
    title=settings.app_name,
    description=(
        "KI-Recruiting-Agent für Zeitarbeitsfirmen. "
        "Verwaltet Bewerber, Aufträge, Termine und kommuniziert per E-Mail und Telefon – "
        "immer mit Human-in-the-Loop."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router einbinden
app.include_router(agent.router, prefix="/api")
app.include_router(applicants.router, prefix="/api")
app.include_router(job_orders.router, prefix="/api")
app.include_router(appointments.router, prefix="/api")
app.include_router(approvals.router, prefix="/api")
app.include_router(phone.router, prefix="/api")


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def dashboard():
    """Einfaches Dashboard."""
    return """
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sedik Recruiting Agent</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
               background: #f0f4ff; min-height: 100vh; display: flex; flex-direction: column; }
        header { background: #1a56db; color: white; padding: 20px 40px;
                 display: flex; align-items: center; gap: 16px; }
        header h1 { font-size: 1.5rem; }
        header p { font-size: 0.9rem; opacity: 0.8; }
        .badge { background: #10b981; color: white; padding: 4px 10px;
                 border-radius: 20px; font-size: 0.75rem; }
        main { flex: 1; padding: 40px; max-width: 1000px; margin: 0 auto; width: 100%; }
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .card { background: white; border-radius: 12px; padding: 24px;
                box-shadow: 0 1px 4px rgba(0,0,0,.08); border: 1px solid #e5e7eb; }
        .card h3 { font-size: 0.85rem; color: #6b7280; text-transform: uppercase;
                   letter-spacing: .05em; margin-bottom: 8px; }
        .card .icon { font-size: 1.8rem; margin-bottom: 8px; }
        .card a { color: #1a56db; text-decoration: none; font-weight: 500; }
        .chat-box { background: white; border-radius: 12px; padding: 24px;
                    box-shadow: 0 1px 4px rgba(0,0,0,.08); border: 1px solid #e5e7eb; }
        .chat-box h2 { margin-bottom: 16px; color: #111827; }
        #messages { height: 320px; overflow-y: auto; border: 1px solid #e5e7eb;
                    border-radius: 8px; padding: 16px; margin-bottom: 12px;
                    background: #f9fafb; display: flex; flex-direction: column; gap: 12px; }
        .msg { max-width: 80%; padding: 10px 14px; border-radius: 10px; font-size: 0.9rem; line-height: 1.5; }
        .msg.user { background: #1a56db; color: white; align-self: flex-end; border-radius: 10px 10px 2px 10px; }
        .msg.agent { background: white; border: 1px solid #e5e7eb; align-self: flex-start; border-radius: 10px 10px 10px 2px; }
        .input-row { display: flex; gap: 8px; }
        #user-input { flex: 1; padding: 10px 14px; border: 1px solid #d1d5db;
                      border-radius: 8px; font-size: 0.95rem; outline: none; }
        #user-input:focus { border-color: #1a56db; box-shadow: 0 0 0 3px #dbeafe; }
        button { background: #1a56db; color: white; border: none; padding: 10px 20px;
                 border-radius: 8px; font-size: 0.95rem; cursor: pointer; font-weight: 500; }
        button:hover { background: #1e40af; }
        button:disabled { background: #93c5fd; cursor: not-allowed; }
        .spinner { display: inline-block; width: 16px; height: 16px;
                   border: 2px solid #fff; border-top-color: transparent;
                   border-radius: 50%; animation: spin .6s linear infinite; margin-right: 6px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <header>
        <div>
          <h1>🤖 Sedik Recruiting Agent</h1>
          <p>KI-gestütztes Recruiting für Zeitarbeitsfirmen</p>
        </div>
        <span class="badge">Live</span>
      </header>
      <main>
        <div class="cards">
          <div class="card">
            <div class="icon">📋</div>
            <h3>API-Docs</h3>
            <a href="/docs">Swagger UI öffnen →</a>
          </div>
          <div class="card">
            <div class="icon">👥</div>
            <h3>Bewerber</h3>
            <a href="/api/applicants/">Alle Bewerber →</a>
          </div>
          <div class="card">
            <div class="icon">📁</div>
            <h3>Aufträge</h3>
            <a href="/api/job-orders/">Alle Aufträge →</a>
          </div>
          <div class="card">
            <div class="icon">📅</div>
            <h3>Termine</h3>
            <a href="/api/appointments/upcoming">Bevorstehende →</a>
          </div>
          <div class="card">
            <div class="icon">✅</div>
            <h3>Genehmigungen</h3>
            <a href="/api/approvals/">Ausstehend →</a>
          </div>
        </div>

        <div class="chat-box">
          <h2>💬 Agent Chat</h2>
          <div id="messages">
            <div class="msg agent">
              Hallo! Ich bin Sedik, Ihr KI-Recruiting-Agent. Ich helfe Ihnen bei:
              Bewerber anlegen, Qualifikationen prüfen, Aufträge erfassen, Gespräche terminieren und mehr.
              Wie kann ich Ihnen heute helfen?
            </div>
          </div>
          <div class="input-row">
            <input id="user-input" type="text" placeholder="Nachricht eingeben..." />
            <button id="send-btn" onclick="sendMessage()">Senden</button>
          </div>
        </div>
      </main>
      <script>
        let conversationId = null;
        const input = document.getElementById('user-input');
        const btn = document.getElementById('send-btn');
        const messages = document.getElementById('messages');

        input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

        function addMessage(text, role) {
          const div = document.createElement('div');
          div.className = 'msg ' + role;
          div.textContent = text;
          messages.appendChild(div);
          messages.scrollTop = messages.scrollHeight;
        }

        async function sendMessage() {
          const text = input.value.trim();
          if (!text) return;
          input.value = '';
          addMessage(text, 'user');
          btn.disabled = true;
          btn.innerHTML = '<span class="spinner"></span>Denke...';

          try {
            const res = await fetch('/api/agent/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: text, conversation_id: conversationId }),
            });
            const data = await res.json();
            conversationId = data.conversation_id;
            addMessage(data.response, 'agent');
          } catch (e) {
            addMessage('Fehler: ' + e.message, 'agent');
          } finally {
            btn.disabled = false;
            btn.innerHTML = 'Senden';
            input.focus();
          }
        }
      </script>
    </body>
    </html>
    """


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": settings.app_name}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.debug)
