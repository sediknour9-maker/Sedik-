-- ============================================================
-- Zeitarbeit Rezeptionist – PostgreSQL Schema
-- Hetzner Server
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SESSIONS – Eine Session pro Nutzer pro Kanal
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel         VARCHAR(20)  NOT NULL CHECK (channel IN ('whatsapp','telegram','chat','email')),
    user_identifier VARCHAR(255) NOT NULL,  -- Telefon / chat_id / E-Mail
    user_type       VARCHAR(20)  DEFAULT 'unknown' CHECK (user_type IN ('unknown','applicant','company')),
    status          VARCHAR(30)  DEFAULT 'active' CHECK (status IN (
                        'active','waiting_approval','approved','rejected',
                        'completed','escalated','paused'
                    )),
    dsgvo_consent   BOOLEAN      DEFAULT FALSE,
    dsgvo_timestamp TIMESTAMP,
    collected_data  JSONB        DEFAULT '{}',
    metadata        JSONB        DEFAULT '{}',
    assigned_staff  VARCHAR(255),            -- E-Mail des zuständigen Mitarbeiters
    created_at      TIMESTAMP    DEFAULT NOW(),
    updated_at      TIMESTAMP    DEFAULT NOW(),
    UNIQUE (channel, user_identifier)
);

CREATE INDEX idx_sessions_status    ON sessions(status);
CREATE INDEX idx_sessions_channel   ON sessions(channel);
CREATE INDEX idx_sessions_user_type ON sessions(user_type);

-- ============================================================
-- CONVERSATION_HISTORY – Vollständiger Gesprächsverlauf
-- ============================================================
CREATE TABLE IF NOT EXISTS conversation_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id  UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role        VARCHAR(20)  NOT NULL CHECK (role IN ('user','assistant','system')),
    content     TEXT         NOT NULL,
    created_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_conv_session ON conversation_history(session_id, created_at);

-- ============================================================
-- APPLICANT_PROFILES – Bewerber-Daten
-- ============================================================
CREATE TABLE IF NOT EXISTS applicant_profiles (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id           UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    full_name            VARCHAR(255),
    birth_date           DATE,
    phone                VARCHAR(50),
    email                VARCHAR(255),
    employment_status    VARCHAR(100),
    education            VARCHAR(255),
    experience_years     INTEGER,
    experience_industries TEXT[],
    desired_position     VARCHAR(255),
    availability_from    DATE,
    work_type            VARCHAR(20) CHECK (work_type IN ('fulltime','parttime','both')),
    location_preference  VARCHAR(255),
    commute_km           INTEGER,
    driving_license      VARCHAR(30),
    own_vehicle          BOOLEAN,
    german_level         VARCHAR(10),
    other_languages      TEXT[],
    certificates         TEXT[],
    special_skills       TEXT,
    qualification_score  INTEGER,         -- 1-10, intern vergeben vom Mitarbeiter
    notes                TEXT,
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- COMPANY_REQUESTS – Unternehmens-Anfragen
-- ============================================================
CREATE TABLE IF NOT EXISTS company_requests (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id              UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    company_name            VARCHAR(255),
    contact_person          VARCHAR(255),
    contact_position        VARCHAR(100),
    phone                   VARCHAR(50),
    email                   VARCHAR(255),
    position_needed         VARCHAR(255),
    workers_count           INTEGER,
    start_date              DATE,
    duration_weeks          INTEGER,
    qualifications_required TEXT,
    work_hours              VARCHAR(100),
    shift_system            BOOLEAN,
    work_location_address   VARCHAR(500),
    industry                VARCHAR(100),
    budget_per_hour         DECIMAL(10,2),
    additional_requirements TEXT,
    priority                VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- APPOINTMENTS – Termine
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id        UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    appointment_type  VARCHAR(30)  CHECK (appointment_type IN ('interview','consultation','followup')),
    scheduled_at      TIMESTAMP,
    duration_minutes  INTEGER      DEFAULT 30,
    status            VARCHAR(20)  DEFAULT 'pending' CHECK (status IN (
                          'pending','confirmed','cancelled','completed','no_show'
                      )),
    google_event_id   VARCHAR(255),
    location          VARCHAR(255) DEFAULT 'online',
    meeting_link      VARCHAR(500),
    notes             TEXT,
    confirmed_by      VARCHAR(255),         -- Mitarbeiter der bestätigt hat
    confirmed_at      TIMESTAMP,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- APPROVAL_TOKENS – Genehmigung durch Mitarbeiter
-- ============================================================
CREATE TABLE IF NOT EXISTS approval_tokens (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id       UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    token            VARCHAR(64)  UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    action_type      VARCHAR(50)  NOT NULL,  -- 'new_applicant','new_company','appointment','escalation'
    action_summary   TEXT,                   -- Formatierte Zusammenfassung für Mitarbeiter
    full_data        JSONB        DEFAULT '{}',
    status           VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
    staff_email      VARCHAR(255),
    staff_note       TEXT,
    expires_at       TIMESTAMP    DEFAULT (NOW() + INTERVAL '72 hours'),
    responded_by     VARCHAR(255),
    responded_at     TIMESTAMP,
    n8n_resume_url   VARCHAR(1000),          -- n8n Wait-Node Resume URL
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_approval_token  ON approval_tokens(token);
CREATE INDEX idx_approval_status ON approval_tokens(status);
CREATE INDEX idx_approval_session ON approval_tokens(session_id);

-- ============================================================
-- STAFF_NOTIFICATIONS – Alle Benachrichtigungen ans Team
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_notifications (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id   UUID REFERENCES sessions(id),
    type         VARCHAR(50),  -- 'approval_request','escalation','appointment','info'
    subject      VARCHAR(255),
    body         TEXT,
    sent_to      VARCHAR(255),
    sent_at      TIMESTAMP DEFAULT NOW(),
    read_at      TIMESTAMP
);

-- ============================================================
-- TRIGGER: updated_at automatisch aktualisieren
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER applicant_updated_at
    BEFORE UPDATE ON applicant_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER company_updated_at
    BEFORE UPDATE ON company_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VIEWS – Nützliche Übersichten
-- ============================================================

CREATE OR REPLACE VIEW v_active_applicants AS
SELECT
    s.id            AS session_id,
    s.channel,
    s.user_identifier,
    s.status,
    s.created_at    AS contact_date,
    ap.full_name,
    ap.phone,
    ap.email,
    ap.desired_position,
    ap.availability_from,
    ap.work_type
FROM sessions s
JOIN applicant_profiles ap ON ap.session_id = s.id
WHERE s.user_type = 'applicant'
ORDER BY s.created_at DESC;

CREATE OR REPLACE VIEW v_active_company_requests AS
SELECT
    s.id            AS session_id,
    s.channel,
    s.status,
    s.created_at    AS contact_date,
    cr.company_name,
    cr.contact_person,
    cr.phone,
    cr.position_needed,
    cr.workers_count,
    cr.start_date,
    cr.priority
FROM sessions s
JOIN company_requests cr ON cr.session_id = s.id
WHERE s.user_type = 'company'
ORDER BY cr.priority DESC, s.created_at DESC;

CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT
    at.id           AS approval_id,
    at.token,
    at.action_type,
    at.action_summary,
    at.staff_email,
    at.expires_at,
    at.created_at,
    s.channel,
    s.user_type,
    s.user_identifier
FROM approval_tokens at
JOIN sessions s ON s.id = at.session_id
WHERE at.status = 'pending'
  AND at.expires_at > NOW()
ORDER BY at.created_at DESC;
