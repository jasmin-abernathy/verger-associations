import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export const ACCOUNT_ROLES = Object.freeze(["administrator", "facilitator", "member", "reader"]);
export const POLL_VISIBILITIES = Object.freeze(["members", "public_after_close"]);
export const POLL_STATUSES = Object.freeze(["open", "closed", "cancelled"]);

export function openAuthorityDatabase(location) {
  if (location !== ":memory:") fs.mkdirSync(path.dirname(location), { recursive: true });
  const db = new DatabaseSync(location, { enableForeignKeyConstraints: true });
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  migrateAuthorityDatabase(db);
  return db;
}

export function migrateAuthorityDatabase(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('administrator','facilitator','member','reader')),
      member_id TEXT,
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
      created_at TEXT NOT NULL,
      UNIQUE (organization_id, email)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      created_by_account_id TEXT NOT NULL REFERENCES accounts(id),
      email TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('administrator','facilitator','member','reader')),
      member_id TEXT,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS polls (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      created_by_account_id TEXT NOT NULL REFERENCES accounts(id),
      title TEXT NOT NULL,
      question TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','cancelled')),
      results_visibility TEXT NOT NULL CHECK (results_visibility IN ('members','public_after_close')),
      deadline_at TEXT,
      first_response_at TEXT,
      created_at TEXT NOT NULL,
      closed_at TEXT,
      cancelled_at TEXT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS poll_options (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      position INTEGER NOT NULL,
      UNIQUE (poll_id, position)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS poll_responses (
      poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      option_id TEXT NOT NULL REFERENCES poll_options(id) ON DELETE RESTRICT,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (poll_id, account_id)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id TEXT NOT NULL,
      account_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details_json TEXT,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON invitations(token_hash);
    CREATE INDEX IF NOT EXISTS idx_polls_organization_status ON polls(organization_id, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_responses_poll ON poll_responses(poll_id);
  `);
}

export function transaction(db, callback) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = callback();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch {}
    throw error;
  }
}
