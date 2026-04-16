"""Demo-Seite und einbettbares Widget pro Mandant."""

import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from services.tenant_service import TenantService
from config import settings

router = APIRouter(prefix="/demo", tags=["Demo"])

TEMPLATE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "templates", "demo"
)


def _load_template(name: str) -> str:
    path = os.path.join(TEMPLATE_DIR, name)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


@router.get("/{tenant_short}", response_class=HTMLResponse)
async def demo_page(tenant_short: str, db: AsyncSession = Depends(get_db)):
    """
    Gebrandete Demo-Seite für einen Mandanten.
    URL: /demo/alero
    """
    svc = TenantService(db)
    tenant = await svc.get_by_short(tenant_short)

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail=f"Kein Demo für '{tenant_short}' gefunden."
        )

    # Mandantenspezifische Demo-Vorlage (z.B. alero.html) oder generische
    template_file = f"{tenant_short}.html"
    template_path = os.path.join(TEMPLATE_DIR, template_file)

    if os.path.exists(template_path):
        html = _load_template(template_file)
    else:
        # Generische Demo-Seite mit Tenant-Daten
        html = _build_generic_demo(tenant)

    # Basis-URL dynamisch einsetzen
    html = html.replace("{{ base_url }}", settings.app_url)
    html = html.replace("{{ tenant_short }}", tenant.company_short)
    html = html.replace("{{ company_name }}", tenant.company_name)
    html = html.replace("{{ agent_name }}", tenant.agent_name)
    html = html.replace("{{ primary_color }}", tenant.primary_color)

    return HTMLResponse(content=html)


@router.get("/{tenant_short}/widget.js")
async def widget_js(tenant_short: str, db: AsyncSession = Depends(get_db)):
    """
    Einbettbares Chat-Widget als JavaScript.
    Embed-Code: <script src="/demo/alero/widget.js"></script>
    """
    svc = TenantService(db)
    tenant = await svc.get_by_short(tenant_short)
    if not tenant:
        raise HTTPException(status_code=404, detail="Mandant nicht gefunden.")

    template = _load_template("widget.js.j2")
    js = (
        template
        .replace("{{ base_url }}", settings.app_url)
        .replace("{{ tenant_short }}", tenant.company_short)
        .replace("{{ company_name }}", tenant.company_name)
        .replace("{{ agent_name }}", tenant.agent_name)
        .replace("{{ primary_color }}", tenant.primary_color)
        .replace("{{ dark_color }}", tenant.accent_color or "#1a1a2e")
    )
    return Response(
        content=js,
        media_type="application/javascript",
        headers={"Cache-Control": "public, max-age=300"},
    )


@router.get("/{tenant_short}/embed")
async def embed_info(tenant_short: str, db: AsyncSession = Depends(get_db)):
    """Gibt Einbindungsanleitung und Embed-Code zurück."""
    svc = TenantService(db)
    tenant = await svc.get_by_short(tenant_short)
    if not tenant:
        raise HTTPException(status_code=404, detail="Mandant nicht gefunden.")

    base = settings.app_url
    return {
        "demo_url":   f"{base}/demo/{tenant_short}",
        "widget_url": f"{base}/demo/{tenant_short}/widget.js",
        "embed_code": f'<script src="{base}/demo/{tenant_short}/widget.js"></script>',
        "iframe_code": (
            f'<iframe src="{base}/demo/{tenant_short}" '
            f'width="100%" height="700" frameborder="0" '
            f'allow="microphone" title="{tenant.company_name} Recruiting"></iframe>'
        ),
        "instructions": {
            "widget_button": (
                "Fügen Sie den embed_code kurz vor </body> ein. "
                "Ein Chat-Button erscheint unten rechts auf jeder Seite."
            ),
            "iframe": (
                "Nutzen Sie den iframe_code um die Demo direkt "
                "in eine bestehende Seite (z.B. Kontakt-Seite) einzubetten."
            ),
        },
    }


def _build_generic_demo(tenant) -> str:
    """Generische Demo-Seite wenn keine firmenspezifische Vorlage existiert."""
    return f"""<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{tenant.company_name} – KI-Recruiting Demo</title>
  <style>
    body{{font-family:system-ui,sans-serif;background:#f5f5f5;margin:0}}
    .header{{background:{tenant.primary_color};color:white;padding:20px 32px}}
    .header h1{{margin:0;font-size:1.4rem}}
    .main{{max-width:700px;margin:40px auto;padding:0 20px}}
    .card{{background:white;border-radius:12px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.08)}}
    #msgs{{height:350px;overflow-y:auto;padding:12px;border:1px solid #e5e7eb;border-radius:8px;
           display:flex;flex-direction:column;gap:10px;margin-bottom:12px;background:#f9fafb}}
    .msg{{max-width:80%;padding:10px 14px;border-radius:12px;font-size:.9rem;line-height:1.5}}
    .agent{{background:#f3f4f6;border:1px solid #e5e7eb;align-self:flex-start}}
    .user{{background:{tenant.primary_color};color:white;align-self:flex-end}}
    .row{{display:flex;gap:8px}}
    input{{flex:1;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:24px;font-size:.9rem;outline:none}}
    input:focus{{border-color:{tenant.primary_color}}}
    button{{background:{tenant.primary_color};color:white;border:none;padding:10px 22px;
            border-radius:24px;cursor:pointer;font-size:.9rem}}
  </style>
</head>
<body>
  <div class="header"><h1>🤖 {tenant.company_name} – Recruiting-Assistent</h1></div>
  <div class="main">
    <div class="card">
      <div id="msgs"></div>
      <div class="row">
        <input id="inp" type="text" placeholder="Nachricht eingeben…" />
        <button onclick="send()">Senden</button>
      </div>
    </div>
  </div>
  <script>
    let cid = null;
    const inp = document.getElementById('inp');
    const msgs = document.getElementById('msgs');
    inp.addEventListener('keydown', e => {{ if(e.key==='Enter') send(); }});
    function add(t,r) {{
      const d=document.createElement('div');
      d.className='msg '+r; d.textContent=t;
      msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight;
    }}
    async function send() {{
      const t=inp.value.trim(); if(!t) return;
      inp.value=''; add(t,'user');
      const r=await fetch('/api/agent/chat',{{method:'POST',
        headers:{{'Content-Type':'application/json','X-Tenant':'{tenant.company_short}'}},
        body:JSON.stringify({{message:t,conversation_id:cid,tenant_short:'{tenant.company_short}'}})
      }});
      const d=await r.json(); cid=d.conversation_id; add(d.response,'agent');
    }}
    add('{tenant.agent_greeting or "Guten Tag! Wie kann ich Ihnen helfen?"}','agent');
  </script>
</body>
</html>"""
