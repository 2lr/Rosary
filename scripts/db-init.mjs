/**
 * Creates the schema on whatever DATABASE_URL points at (or the local SQLite
 * file when it is unset). Next.js does this lazily on first use too; this is
 * for provisioning a Postgres database before the first deploy.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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

// The schema lives in TypeScript, so read it as text rather than importing it.
const source = readFileSync(resolve(ROOT, 'lib/db/schema.ts'), 'utf8');
const statements = [...source.matchAll(/`([^`]*)`/g)].map((m) => m[1].trim()).filter(Boolean);

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
  for (const statement of statements) await client.query(statement);
  await client.end();
  console.log(`Schema ready on Postgres (${statements.length} statements).`);
} else {
  const file = process.env.SQLITE_PATH?.trim() || 'data/rosary.db';
  const { mkdirSync } = await import('node:fs');
  mkdirSync(dirname(resolve(ROOT, file)), { recursive: true });
  const { default: Database } = await import('better-sqlite3');
  const db = new Database(resolve(ROOT, file));
  db.pragma('journal_mode = WAL');
  for (const statement of statements) db.prepare(statement).run();
  db.close();
  console.log(`Schema ready in ${file} (${statements.length} statements).`);
}
