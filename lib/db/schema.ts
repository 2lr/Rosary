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
     colors        TEXT,
     loop_shape    TEXT,
     hail_mary     TEXT,
     invite_code   TEXT,
     invited_by    TEXT,
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
  `CREATE TABLE IF NOT EXISTS novena_runs (
     id         TEXT PRIMARY KEY,
     user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     novena     TEXT NOT NULL,
     started_on TEXT NOT NULL,
     created_at TEXT NOT NULL,
     kept_at    TEXT,
     UNIQUE (user_id, novena, started_on)
   )`,
  `CREATE TABLE IF NOT EXISTS novena_days (
     user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     novena     TEXT NOT NULL,
     started_on TEXT NOT NULL,
     day        TEXT NOT NULL,
     marked_at  TEXT NOT NULL,
     hail_marys INTEGER NOT NULL DEFAULT 0,
     our_fathers INTEGER NOT NULL DEFAULT 0,
     glory_bes  INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (user_id, novena, started_on, day)
   )`,
  `CREATE INDEX IF NOT EXISTS novena_days_user
     ON novena_days (user_id, novena, started_on)`,
  `CREATE INDEX IF NOT EXISTS novena_runs_user
     ON novena_runs (user_id, started_on DESC)`,
  `CREATE INDEX IF NOT EXISTS rosaries_user_started
     ON rosaries (user_id, started_at DESC)`,
  `CREATE INDEX IF NOT EXISTS rosaries_user_status
     ON rosaries (user_id, status)`,
];

/**
 * Applied after the schema, each one ignored if it fails. SQLite has no
 * `ADD COLUMN IF NOT EXISTS`, so "already exists" is the expected outcome on
 * every run but the first.
 */
export const MIGRATION_STATEMENTS = [
  `ALTER TABLE users ADD COLUMN colors TEXT`,
  `ALTER TABLE users ADD COLUMN loop_shape TEXT`,
  `ALTER TABLE users ADD COLUMN hail_mary TEXT`,
  `ALTER TABLE novena_runs ADD COLUMN kept_at TEXT`,
  `ALTER TABLE novena_days ADD COLUMN hail_marys INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE novena_days ADD COLUMN our_fathers INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE novena_days ADD COLUMN glory_bes INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN invite_code TEXT`,
  `ALTER TABLE users ADD COLUMN invited_by TEXT`,
  // The indexes come after the columns they are on, and go here rather than
  // with the schema: on a database that already exists the column does not
  // arrive until the line above, and a failed schema statement is fatal where
  // a failed migration is expected.
  `CREATE UNIQUE INDEX IF NOT EXISTS users_invite_code ON users (invite_code)`,
  `CREATE INDEX IF NOT EXISTS users_invited_by ON users (invited_by)`,
];
