/**
 * Written to be valid on both SQLite and Postgres: timestamps are stored as
 * ISO-8601 TEXT (which sorts correctly on both) and JSON as TEXT.
 */
export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
     id            TEXT PRIMARY KEY,
     email         TEXT NOT NULL UNIQUE,
     password_hash TEXT NOT NULL,
     display_name  TEXT,
     lang          TEXT NOT NULL DEFAULT 'fr',
     created_at    TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS rosaries (
     id                TEXT PRIMARY KEY,
     user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     kind              TEXT NOT NULL,
     mode              TEXT NOT NULL,
     mystery_set       TEXT,
     lang              TEXT NOT NULL,
     intention         TEXT,
     status            TEXT NOT NULL,
     progress          TEXT NOT NULL,
     decades_completed INTEGER NOT NULL DEFAULT 0,
     hail_marys        INTEGER NOT NULL DEFAULT 0,
     started_at        TEXT NOT NULL,
     updated_at        TEXT NOT NULL,
     completed_at      TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS rosaries_user_started
     ON rosaries (user_id, started_at DESC)`,
  `CREATE INDEX IF NOT EXISTS rosaries_user_status
     ON rosaries (user_id, status)`,
];
