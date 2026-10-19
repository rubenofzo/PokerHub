// Applies the SQL migrations in ./drizzle. Runs before every `npm run build`, so a
// Vercel deploy keeps the database schema up to date without any manual step.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

try {
  process.loadEnvFile?.(".env");
} catch {
  // No .env file: rely on the real environment (as on Vercel).
}

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.warn("[migrate] DATABASE_URL is not set, skipping database migrations.");
  process.exit(0);
}

const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const pool = new pg.Pool({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: true }, max: 1 });
try {
  await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
  console.log("[migrate] Database is up to date.");
} finally {
  await pool.end();
}
