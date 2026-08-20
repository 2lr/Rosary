/**
 * Creates the schema on whatever DATABASE_URL points at (or the local SQLite
 * file when it is unset). Next.js does this lazily on first use too; this is
 * for provisioning a Postgres database before the first deploy.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(resolve(ROOT, file), 'utf8').split('\n')) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // No such file; environment variables may already be set.
  }
}

// Node strips the types, so the schema module is the single source of truth
// here as well as at runtime — scraping the file for backticked text also
// picked up prose from its comments.
const { SCHEMA_STATEMENTS, MIGRATION_STATEMENTS } = await import(
  pathToFileURL(resolve(ROOT, 'lib/db/schema.ts')).href
);

const url = process.env.DATABASE_URL?.trim();

if (url && /^postgres(ql)?:\/\//.test(url)) {
  const { default: pg } = await import('pg');
  const client = new pg.Client({
    connectionString: url,
    ssl: /\bsslmode=(require|verify-full|verify-ca)\b/.test(url)
      ? { rejectUnauthorized: false }
      : undefined,
  });
  await client.connect();
  for (const statement of SCHEMA_STATEMENTS) await client.query(statement);
  for (const statement of MIGRATION_STATEMENTS) {
    // Adding a column that is already there is the normal case on any database
    // that has been through this once.
    await client.query(statement).catch(() => undefined);
  }
  await client.end();
  console.log(`Schema ready on Postgres (${SCHEMA_STATEMENTS.length} tables and indexes).`);
} else {
  const file = process.env.SQLITE_PATH?.trim() || 'data/rosary.db';
  const { mkdirSync } = await import('node:fs');
  mkdirSync(dirname(resolve(ROOT, file)), { recursive: true });
  const { default: Database } = await import('better-sqlite3');
  const db = new Database(resolve(ROOT, file));
  db.pragma('journal_mode = WAL');
  for (const statement of SCHEMA_STATEMENTS) db.prepare(statement).run();
  for (const statement of MIGRATION_STATEMENTS) {
    try {
      db.prepare(statement).run();
    } catch {
      // The column is already there.
    }
  }
  db.close();
  console.log(`Schema ready in ${file} (${SCHEMA_STATEMENTS.length} tables and indexes).`);
}
