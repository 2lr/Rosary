import 'server-only';
import { MIGRATION_STATEMENTS, SCHEMA_STATEMENTS } from './schema';

export type Row = Record<string, unknown>;

type Driver = {
  kind: 'sqlite' | 'postgres';
  /** SQL uses `?` placeholders; the Postgres driver rewrites them to `$n`. */
  all: (sql: string, params?: unknown[]) => Promise<Row[]>;
  run: (sql: string, params?: unknown[]) => Promise<void>;
};

function toPostgresPlaceholders(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function createPostgresDriver(url: string): Promise<Driver> {
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({
    connectionString: url,
    max: 5,
    ssl: /\bsslmode=(require|verify-full|verify-ca)\b/.test(url)
      ? { rejectUnauthorized: false }
      : undefined,
  });
  return {
    kind: 'postgres',
    async all(sql, params = []) {
      const res = await pool.query(toPostgresPlaceholders(sql), params);
      return res.rows as Row[];
    },
    async run(sql, params = []) {
      await pool.query(toPostgresPlaceholders(sql), params);
    },
  };
}

async function createSqliteDriver(file: string): Promise<Driver> {
  const { mkdirSync } = await import('node:fs');
  const { dirname } = await import('node:path');
  mkdirSync(dirname(file), { recursive: true });

  const { default: Database } = await import('better-sqlite3');
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return {
    kind: 'sqlite',
    async all(sql, params = []) {
      return db.prepare(sql).all(...(params as never[])) as Row[];
    },
    async run(sql, params = []) {
      db.prepare(sql).run(...(params as never[]));
    },
  };
}

let driverPromise: Promise<Driver> | null = null;

async function connect(): Promise<Driver> {
  const url = process.env.DATABASE_URL?.trim();
  const driver =
    url && /^postgres(ql)?:\/\//.test(url)
      ? await createPostgresDriver(url)
      : await createSqliteDriver(process.env.SQLITE_PATH?.trim() || 'data/rosary.db');

  for (const statement of SCHEMA_STATEMENTS) {
    await driver.run(statement);
  }
  for (const statement of MIGRATION_STATEMENTS) {
    // Adding a column that is already there is the normal case; anything else
    // would have failed on the schema statements above.
    await driver.run(statement).catch(() => undefined);
  }
  return driver;
}

export function db(): Promise<Driver> {
  driverPromise ??= connect().catch((err) => {
    driverPromise = null;
    throw err;
  });
  return driverPromise;
}

export async function all<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await (await db()).all(sql, params)) as T[];
}

export async function one<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await all<T>(sql, params);
  return rows[0] ?? null;
}

export async function run(sql: string, params: unknown[] = []): Promise<void> {
  await (await db()).run(sql, params);
}
