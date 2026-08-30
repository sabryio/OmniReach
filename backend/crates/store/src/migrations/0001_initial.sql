-- Migration 0001 — initial schema
-- All IDs are UUID TEXT. Booleans are INTEGER (0/1). Timestamps are INTEGER (Unix ms).
-- JSON arrays/objects are stored as TEXT and (de)serialised in Rust.

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id                      TEXT PRIMARY KEY,
    name                    TEXT NOT NULL,
    phone_number            TEXT,
    status                  TEXT NOT NULL DEFAULT 'disconnected',
    api_key                 TEXT NOT NULL,
    hourly_limit            INTEGER NOT NULL DEFAULT 20,
    daily_limit             INTEGER NOT NULL DEFAULT 200,
    hourly_sent_timestamps  TEXT NOT NULL DEFAULT '[]',
    daily_sent_timestamps   TEXT NOT NULL DEFAULT '[]',
    qr_code_data            TEXT,
    last_activity_at        INTEGER
);

CREATE TABLE IF NOT EXISTS campaigns (
    id                  TEXT PRIMARY KEY,
    title               TEXT NOT NULL,
    template_text       TEXT NOT NULL,
    image_url           TEXT,
    image_file_name     TEXT,
    session_ids         TEXT NOT NULL DEFAULT '[]',
    status              TEXT NOT NULL DEFAULT 'running',
    created_at          INTEGER NOT NULL,
    started_at          INTEGER,
    completed_at        INTEGER,
    scheduled_for       INTEGER,
    total_contacts      INTEGER NOT NULL DEFAULT 0,
    verified_contacts   INTEGER NOT NULL DEFAULT 0,
    unregistered_count  INTEGER NOT NULL DEFAULT 0,
    sent_count          INTEGER NOT NULL DEFAULT 0,
    skipped_count       INTEGER NOT NULL DEFAULT 0,
    failed_count        INTEGER NOT NULL DEFAULT 0,
    is_archived         INTEGER NOT NULL DEFAULT 0,
    archived_at         INTEGER
);

CREATE TABLE IF NOT EXISTS contacts (
    id                  TEXT PRIMARY KEY,
    campaign_id         TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    raw_phone           TEXT NOT NULL,
    formatted_phone     TEXT NOT NULL,
    normalized_phone    TEXT NOT NULL,
    custom_fields       TEXT NOT NULL DEFAULT '{}',
    verification_status TEXT NOT NULL DEFAULT 'unverified',
    verification_error  TEXT,
    verified_at         INTEGER,
    wa_id               TEXT
);

CREATE TABLE IF NOT EXISTS queue_items (
    id                      TEXT PRIMARY KEY,
    campaign_id             TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    campaign_title          TEXT NOT NULL,
    contact_id              TEXT NOT NULL REFERENCES contacts(id),
    phone                   TEXT NOT NULL,
    recipient_name          TEXT,
    rendered_text           TEXT NOT NULL,
    image_url               TEXT,
    status                  TEXT NOT NULL DEFAULT 'pending',
    assigned_session_id     TEXT,
    attempts                INTEGER NOT NULL DEFAULT 0,
    last_error              TEXT,
    sent_at                 INTEGER,
    scheduled_for           INTEGER,
    rate_limit_hold_until   INTEGER,
    time_window_hold_until  INTEGER,
    response_payload        TEXT
);

CREATE TABLE IF NOT EXISTS logs (
    id        TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL,
    level     TEXT NOT NULL,
    category  TEXT NOT NULL,
    message   TEXT NOT NULL,
    details   TEXT
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_contacts_campaign    ON contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_queue_campaign       ON queue_items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_queue_status         ON queue_items(status);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp       ON logs(timestamp DESC);
