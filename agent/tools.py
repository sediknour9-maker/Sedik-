"""Tool-Definitionen für den Claude Recruiting-Agenten."""

AGENT_TOOLS = [
    # ── Bewerber ──────────────────────────────────────────────────────────────
    {
        "name": "create_applicant",
        "description": (
            "Legt einen neuen Bewerber in der Datenbank an. "
            "WICHTIG: Benötigt vorherige Mitarbeiter-Genehmigung. "
            "Zuerst request_approval aufrufen, dann nach Genehmigung dieses Tool."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "first_name": {"type": "string", "description": "Vorname"},
                "last_name": {"type": "string", "description": "Nachname"},
                "email": {"type": "string", "description": "E-Mail-Adresse"},
                "phone": {"type": "string", "description": "Telefonnummer"},
                "desired_position": {"type": "string", "description": "Gewünschte Stelle"},
                "skills": {"type": "string", "description": "Fähigkeiten (kommagetrennt oder JSON-Array)"},
                "experience_years": {"type": "number", "description": "Berufserfahrung in Jahren"},
                "education": {"type": "string", "description": "Ausbildung/Studium"},
                "languages": {"type": "string", "description": "Sprachkenntnisse"},
                "availability_date": {"type": "string", "description": "Verfügbar ab (YYYY-MM-DD)"},
                "desired_salary": {"type": "string", "description": "Gehaltsvorstellung"},
                "source": {"type": "string", "description": "Woher kam der Bewerber"},
                "notes": {"type": "string", "description": "Interne Notizen"},
            },
            "required": ["first_name", "last_name"],
        },
    },
    {
        "name": "search_applicants",
        "description": "Sucht Bewerber in der Datenbank nach Name, E-Mail, Stelle oder Status.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Suchbegriff (Name, E-Mail, Stelle)"},
                "status": {"type": "string", "description": "Filter nach Status (neu/qualifiziert/eingeladen/etc.)"},
                "skill": {"type": "string", "description": "Filter nach Fähigkeit"},
                "limit": {"type": "integer", "description": "Max. Anzahl Ergebnisse", "default": 10},
            },
        },
    },
    {
        "name": "get_applicant",
        "description": "Gibt detaillierte Informationen zu einem Bewerber zurück.",
        "input_schema": {
            "type": "object",
            "properties": {
                "applicant_id": {"type": "string", "description": "Bewerber-ID"},
            },
            "required": ["applicant_id"],
        },
    },
    {
        "name": "update_applicant",
        "description": "Aktualisiert Bewerberdaten oder Status.",
        "input_schema": {
            "type": "object",
            "properties": {
                "applicant_id": {"type": "string", "description": "Bewerber-ID"},
                "updates": {
                    "type": "object",
                    "description": "Zu aktualisierende Felder als Key-Value-Paare",
                },
            },
            "required": ["applicant_id", "updates"],
        },
    },
    # ── Qualifikation ─────────────────────────────────────────────────────────
    {
        "name": "check_qualification",
        "description": (
            "Prüft die Qualifikation eines Bewerbers. "
            "Analysiert Skills, Erfahrung und Eignung. "
            "Gibt Score und Empfehlung zurück. Benötigt anschließend Mitarbeiter-Bestätigung."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "applicant_id": {"type": "string", "description": "Bewerber-ID"},
                "job_order_id": {"type": "string", "description": "Auftrags-ID (optional, für stellenbezogene Prüfung)"},
                "analysis": {
                    "type": "string",
                    "description": (
                        "Deine KI-Analyse als JSON-String mit Feldern: "
                        "overall_score (0-100), skill_match_score, experience_match_score, "
                        "availability_match (bool), strengths (Liste), gaps (Liste), recommendation (Text)"
                    ),
                },
            },
            "required": ["applicant_id"],
        },
    },
    # ── Aufträge ──────────────────────────────────────────────────────────────
    {
        "name": "create_job_order",
        "description": (
            "Legt einen neuen Stellenauftrag an. "
            "WICHTIG: Benötigt vorherige Mitarbeiter-Genehmigung."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Name des Kundenunternehmens"},
                "company_contact_name": {"type": "string", "description": "Ansprechpartner beim Kunden"},
                "company_contact_email": {"type": "string", "description": "E-Mail des Ansprechpartners"},
                "company_contact_phone": {"type": "string", "description": "Telefon des Ansprechpartners"},
                "title": {"type": "string", "description": "Stellenbezeichnung"},
                "description": {"type": "string", "description": "Stellenbeschreibung"},
                "required_skills": {"type": "string", "description": "Benötigte Fähigkeiten (JSON-Array oder kommagetrennt)"},
                "required_experience_years": {"type": "number", "description": "Mindest-Berufserfahrung in Jahren"},
                "location": {"type": "string", "description": "Arbeitsort"},
                "start_date": {"type": "string", "description": "Startdatum (YYYY-MM-DD)"},
                "end_date": {"type": "string", "description": "Enddatum (YYYY-MM-DD), falls befristet"},
                "positions_count": {"type": "integer", "description": "Anzahl der Stellen", "default": 1},
                "hourly_rate_min": {"type": "number", "description": "Stundenlohn min (€)"},
                "hourly_rate_max": {"type": "number", "description": "Stundenlohn max (€)"},
                "shift_type": {"type": "string", "description": "Schichttyp (Tagschicht/Frühschicht/Spätschicht/Nachtschicht)"},
                "priority": {"type": "string", "description": "Priorität (niedrig/normal/hoch/dringend)", "default": "normal"},
                "notes": {"type": "string", "description": "Interne Notizen"},
            },
            "required": ["company_name", "title"],
        },
    },
    {
        "name": "search_job_orders",
        "description": "Sucht offene oder alle Stellenaufträge.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Suchbegriff"},
                "status": {"type": "string", "description": "Filter nach Status"},
                "company": {"type": "string", "description": "Filter nach Unternehmen"},
            },
        },
    },
    # ── Termine ───────────────────────────────────────────────────────────────
    {
        "name": "create_appointment",
        "description": (
            "Legt einen Termin (Bewerbungsgespräch etc.) an. "
            "WICHTIG: Benötigt Mitarbeiter-Genehmigung bevor die Einladung versendet wird."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "applicant_id": {"type": "string", "description": "Bewerber-ID"},
                "job_order_id": {"type": "string", "description": "Auftrags-ID (optional)"},
                "appointment_type": {
                    "type": "string",
                    "description": "Art des Termins",
                    "enum": ["bewerbungsgespraech", "telefon", "vorstellung_beim_kunden", "nachfolgetermin"],
                },
                "title": {"type": "string", "description": "Terminbezeichnung"},
                "scheduled_at": {"type": "string", "description": "Datum und Uhrzeit (ISO 8601: YYYY-MM-DDTHH:MM:SS)"},
                "duration_minutes": {"type": "integer", "description": "Dauer in Minuten", "default": 60},
                "location": {"type": "string", "description": "Ort oder 'Online'"},
                "meeting_link": {"type": "string", "description": "Video-Call-Link (optional)"},
                "interviewer_name": {"type": "string", "description": "Name des Gesprächsführers"},
                "interviewer_email": {"type": "string", "description": "E-Mail des Gesprächsführers"},
                "notes": {"type": "string", "description": "Hinweise für den Bewerber"},
            },
            "required": ["applicant_id", "title", "appointment_type"],
        },
    },
    # ── E-Mail ────────────────────────────────────────────────────────────────
    {
        "name": "send_interview_invitation",
        "description": (
            "Sendet eine Einladungs-E-Mail für ein Bewerbungsgespräch. "
            "PFLICHT: Erst Mitarbeiter-Genehmigung einholen (request_approval), dann senden."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "appointment_id": {"type": "string", "description": "Termin-ID"},
                "additional_message": {"type": "string", "description": "Zusätzlicher persönlicher Text"},
            },
            "required": ["appointment_id"],
        },
    },
    {
        "name": "send_confirmation_email",
        "description": "Sendet eine Terminbestätigungs-E-Mail an Bewerber oder Mitarbeiter.",
        "input_schema": {
            "type": "object",
            "properties": {
                "to_email": {"type": "string", "description": "Empfänger-E-Mail"},
                "recipient_name": {"type": "string", "description": "Name des Empfängers"},
                "appointment_id": {"type": "string", "description": "Termin-ID"},
            },
            "required": ["to_email", "recipient_name", "appointment_id"],
        },
    },
    {
        "name": "send_custom_email",
        "description": (
            "Sendet eine benutzerdefinierte E-Mail. "
            "WICHTIG: Immer Mitarbeiter-Genehmigung einholen."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "to_emails": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Liste der Empfänger-E-Mails",
                },
                "subject": {"type": "string", "description": "Betreff"},
                "body": {"type": "string", "description": "E-Mail-Text (professionelles Deutsch)"},
            },
            "required": ["to_emails", "subject", "body"],
        },
    },
    # ── Genehmigung / HITL ────────────────────────────────────────────────────
    {
        "name": "request_approval",
        "description": (
            "PFLICHT-Tool: Bittet Mitarbeiter um Genehmigung einer Aktion. "
            "Muss VOR jeder genehmigungspflichtigen Aktion aufgerufen werden. "
            "Gibt Genehmigungs-ID zurück. Nach Genehmigung kann die Aktion ausgeführt werden."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "action_type": {
                    "type": "string",
                    "description": "Art der Aktion",
                    "enum": [
                        "bewerber_anlegen",
                        "qualifizierung_bestaetigen",
                        "auftrag_anlegen",
                        "einladung_senden",
                        "termin_bestaetigen",
                        "email_senden",
                        "absage_senden",
                        "eskalation",
                    ],
                },
                "action_title": {"type": "string", "description": "Kurzer Titel der Aktion"},
                "action_description": {"type": "string", "description": "Ausführliche Beschreibung was getan werden soll"},
                "action_data": {
                    "type": "object",
                    "description": "Relevante Daten zur Aktion (z.B. Bewerberdaten, Termindetails)",
                },
                "applicant_id": {"type": "string", "description": "Bewerber-ID (falls relevant)"},
                "job_order_id": {"type": "string", "description": "Auftrags-ID (falls relevant)"},
            },
            "required": ["action_type", "action_title", "action_description"],
        },
    },
    {
        "name": "escalate_to_staff",
        "description": (
            "Eskaliert eine komplizierte Situation an menschliche Mitarbeiter. "
            "Nutze dieses Tool bei: unklaren Situationen, Beschwerden, sensiblen Themen, "
            "widersprüchlichen Informationen oder wenn du dir unsicher bist."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "issue_title": {"type": "string", "description": "Kurze Beschreibung des Problems"},
                "issue_description": {"type": "string", "description": "Ausführliche Beschreibung der Situation"},
                "suggested_action": {"type": "string", "description": "Dein Vorschlag wie vorzugehen ist"},
                "urgency": {
                    "type": "string",
                    "enum": ["niedrig", "normal", "hoch", "dringend"],
                    "description": "Dringlichkeit",
                    "default": "normal",
                },
                "applicant_id": {"type": "string", "description": "Bewerber-ID (falls relevant)"},
                "conversation_id": {"type": "string", "description": "Gesprächs-ID"},
            },
            "required": ["issue_title", "issue_description"],
        },
    },
    # ── SMS ───────────────────────────────────────────────────────────────────
    {
        "name": "send_sms",
        "description": "Sendet eine SMS an einen Bewerber oder Mitarbeiter.",
        "input_schema": {
            "type": "object",
            "properties": {
                "to_phone": {"type": "string", "description": "Zielnummer (internationales Format, z.B. +49...)"},
                "message": {"type": "string", "description": "SMS-Text (max. 160 Zeichen empfohlen)"},
            },
            "required": ["to_phone", "message"],
        },
    },
    # ── Suche / Info ──────────────────────────────────────────────────────────
    {
        "name": "get_pending_approvals",
        "description": "Gibt alle ausstehenden Genehmigungsanfragen zurück.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_upcoming_appointments",
        "description": "Gibt bevorstehende Termine zurück.",
        "input_schema": {
            "type": "object",
            "properties": {
                "days": {"type": "integer", "description": "Anzahl Tage voraus", "default": 7},
            },
        },
    },
]
