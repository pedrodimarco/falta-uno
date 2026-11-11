import type { DatabaseSync } from "node:sqlite";

/** Esquema inicial compatible con las bases creadas antes de separar las capas. */
export function initializeSchema(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      person_id TEXT NOT NULL REFERENCES people(id),
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      sport TEXT NOT NULL,
      title TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      time_zone TEXT NOT NULL,
      venue TEXT NOT NULL,
      capacity INTEGER NOT NULL CHECK(capacity BETWEEN 2 AND 50),
      price INTEGER,
      currency TEXT NOT NULL,
      notes TEXT NOT NULL,
      organizer_id TEXT NOT NULL REFERENCES people(id)
    );
    CREATE TABLE IF NOT EXISTS participants (
      match_id TEXT NOT NULL REFERENCES matches(id),
      person_id TEXT NOT NULL REFERENCES people(id),
      joined_at TEXT NOT NULL,
      PRIMARY KEY(match_id, person_id)
    );
    CREATE INDEX IF NOT EXISTS participants_person ON participants(person_id);
    CREATE TABLE IF NOT EXISTS email_accounts (
      email TEXT PRIMARY KEY,
      person_id TEXT NOT NULL UNIQUE REFERENCES people(id)
    );
    CREATE TABLE IF NOT EXISTS login_links (
      token_hash TEXT PRIMARY KEY,
      flow_hash TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      return_to TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      consumed_at INTEGER,
      legacy_person_id TEXT,
      legacy_session_hash TEXT
    );
    CREATE TABLE IF NOT EXISTS auth_requests (
      email_hash TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS auth_requests_email ON auth_requests(email_hash, created_at);
    CREATE INDEX IF NOT EXISTS auth_requests_ip ON auth_requests(ip_hash, created_at);
    CREATE TABLE IF NOT EXISTS waitlist_entries (
      sequence INTEGER PRIMARY KEY AUTOINCREMENT,
      id TEXT NOT NULL UNIQUE,
      match_id TEXT NOT NULL REFERENCES matches(id),
      person_id TEXT NOT NULL REFERENCES people(id),
      status TEXT NOT NULL CHECK(status IN ('waiting','offered','accepted','declined','expired','left','closed')),
      created_at INTEGER NOT NULL,
      offered_at INTEGER,
      expires_at INTEGER,
      resolved_at INTEGER
    );
    CREATE UNIQUE INDEX IF NOT EXISTS waitlist_active_person ON waitlist_entries(match_id,person_id)
      WHERE status IN ('waiting','offered');
    CREATE INDEX IF NOT EXISTS waitlist_match_order ON waitlist_entries(match_id,status,sequence);
    CREATE INDEX IF NOT EXISTS waitlist_person_history ON waitlist_entries(match_id,person_id,sequence);
    CREATE TABLE IF NOT EXISTS offer_notifications (
      id TEXT PRIMARY KEY,
      offer_id TEXT NOT NULL UNIQUE REFERENCES waitlist_entries(id),
      created_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      next_attempt_at INTEGER NOT NULL,
      lease_until INTEGER,
      lease_token TEXT,
      sent_at INTEGER,
      discarded_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS offer_notifications_pending ON offer_notifications(next_attempt_at,created_at) WHERE sent_at IS NULL AND discarded_at IS NULL;

  `);
}
