"""Twilio-Webhook für eingehende Anrufe und Sprachverarbeitung."""

import logging
from fastapi import APIRouter, Depends, Form, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from agent import RecruitmentAgent
from services.phone_service import PhoneService
from services.applicant_service import ApplicantService
from models import Conversation, ConversationMessage
from agent.prompts import PHONE_GREETING, PHONE_HOLD_MESSAGE

router = APIRouter(prefix="/phone", tags=["Telefon"])
logger = logging.getLogger(__name__)

PHONE_SYSTEM_ADDENDUM = """
Du führst gerade ein TELEFONAT. Besondere Regeln:
- Antworte KURZ und KLAR (max. 2-3 Sätze)
- Keine Aufzählungen, keine Markdown
- Sprich natürlich wie am Telefon
- Wenn du Informationen brauchst, stelle NUR EINE Frage auf einmal
- Bei komplexen Wünschen: Termin vereinbaren oder an Mitarbeiter übergeben
- Sage immer kurz was du tust: "Ich lege das jetzt für Sie an."
"""


@router.post("/incoming")
async def handle_incoming_call(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Twilio-Webhook: Eingehender Anruf.
    Begrüßt den Anrufer und startet die Konversation.
    """
    form = await request.form()
    caller_phone = form.get("From", "unbekannt")
    call_sid = form.get("CallSid", "")

    logger.info(f"Eingehender Anruf von {caller_phone} (SID: {call_sid})")

    # Bewerber suchen
    applicant_svc = ApplicantService(db)
    applicant = await applicant_svc.find_by_phone(caller_phone)
    caller_name = applicant.full_name if applicant else "Anrufer"

    # Neue Konversation anlegen
    conv = Conversation(
        channel="telefon",
        caller_phone=caller_phone,
        caller_name=caller_name,
        twilio_call_sid=call_sid,
        applicant_id=applicant.id if applicant else None,
    )
    db.add(conv)
    await db.flush()

    greeting = PHONE_GREETING
    if applicant:
        greeting = (
            f"Guten Tag {applicant.full_name}! Sie sind verbunden mit dem Sedik Recruiting Service. "
            f"Schön, dass Sie anrufen. Wie kann ich Ihnen heute helfen?"
        )

    phone_svc = PhoneService()
    action_url = f"{request.base_url}api/phone/respond/{conv.id}"
    twiml = phone_svc.generate_twiml_response(greeting, gather_action=action_url)

    return Response(content=twiml, media_type="application/xml")


@router.post("/respond/{conversation_id}")
async def handle_speech_input(
    conversation_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Twilio-Webhook: Spracherkennung verarbeiten und antworten.
    """
    form = await request.form()
    speech_result = form.get("SpeechResult", "").strip()
    caller_phone = form.get("From", "")

    logger.info(f"Spracheingabe [{conversation_id}]: '{speech_result}'")

    phone_svc = PhoneService()

    if not speech_result:
        twiml = phone_svc.generate_twiml_response(
            "Entschuldigung, ich habe Sie nicht verstanden. Könnten Sie das bitte wiederholen?",
            gather_action=f"{request.base_url}api/phone/respond/{conversation_id}",
        )
        return Response(content=twiml, media_type="application/xml")

    # Konversationshistorie laden
    from sqlalchemy import select
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()

    if not conv:
        twiml = phone_svc.generate_twiml_response("Ein Fehler ist aufgetreten. Bitte rufen Sie erneut an.")
        return Response(content=twiml, media_type="application/xml")

    # Nachrichten aufbauen
    messages = []
    for msg in conv.messages:
        if msg.role in ("user", "assistant"):
            messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": speech_result})

    # Nutzernachricht speichern
    db.add(ConversationMessage(
        conversation_id=conv.id,
        role="user",
        content=speech_result,
    ))

    # Agent antworten lassen
    agent = RecruitmentAgent(db)

    # System-Prompt für Telefon anpassen
    from agent.prompts import SYSTEM_PROMPT
    original_system = agent.client.messages
    # Telefonmodus: kürzere Antworten
    import anthropic
    phone_messages = [{"role": "user", "content": PHONE_SYSTEM_ADDENDUM}] + messages

    result = await agent.chat(phone_messages, conversation_id=conv.id, max_iterations=5)
    agent_response = result["response"]

    # Eskalation erkennen
    escalation_keywords = ["übergebe", "verbinde", "mitarbeiter", "kollege", "weitergeben"]
    needs_escalation = any(kw in agent_response.lower() for kw in escalation_keywords)

    # Antwort speichern
    db.add(ConversationMessage(
        conversation_id=conv.id,
        role="assistant",
        content=agent_response,
    ))
    await db.flush()

    if needs_escalation:
        # Übergabe an Mitarbeiter
        twiml = phone_svc.generate_hold_twiml(PHONE_HOLD_MESSAGE)
    else:
        action_url = f"{request.base_url}api/phone/respond/{conv.id}"
        twiml = phone_svc.generate_twiml_response(agent_response, gather_action=action_url)

    return Response(content=twiml, media_type="application/xml")


@router.post("/status/{conversation_id}")
async def call_status_callback(
    conversation_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Twilio-Webhook: Anruf-Status-Updates (beendet, etc.)."""
    form = await request.form()
    call_status = form.get("CallStatus", "")
    duration = form.get("CallDuration", "0")

    logger.info(f"Anruf-Status [{conversation_id}]: {call_status} (Dauer: {duration}s)")

    from sqlalchemy import select
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()

    if conv and call_status in ("completed", "busy", "no-answer", "failed"):
        conv.status = "beendet"
        await db.flush()

    return Response(content="", status_code=204)
