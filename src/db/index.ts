import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Db = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { pokerhubDb?: Db };

/** Lazily creates one pool, reused across hot reloads in dev and warm invocations on Vercel. */
export function getDb(): Db {
  if (globalForDb.pokerhubDb) return globalForDb.pokerhubDb;
  const connectionString = databaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);
  const pool = new Pool({
    connectionString,
    max: 3,
    ssl: local ? undefined : { rejectUnauthorized: true },
  });
  globalForDb.pokerhubDb = drizzle(pool, { schema });
  return globalForDb.pokerhubDb;
}

/** DATABASE_URL, or POSTGRES_URL as some Vercel storage integrations name it. */
export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

export { schema };
