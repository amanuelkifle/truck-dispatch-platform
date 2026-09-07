// Quick check that db/schema.sql actually ran: lists tables in the
// public schema. Reads DATABASE_URL from .env.local without needing any
// extra dependency (Pool/pg is already a project dependency).
import { readFileSync } from "node:fs";
import pg from "pg";
const { Pool } = pg;

function loadEnvLocal() {
  try {
    const content = readFileSync(".env.local", "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local not found — fall through, DATABASE_URL may already be set
  }
}

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (checked .env.local and the environment).");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const { rows } = await pool.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
  );

  if (rows.length === 0) {
    console.log("No tables found in the public schema.");
    console.log("-> db/schema.sql has not been run yet. Paste its contents into the Supabase SQL Editor and run it.");
  } else {
    console.log(`Found ${rows.length} table(s) in the public schema:\n`);
    for (const row of rows) {
      console.log(`  - ${row.table_name}`);
    }
  }
} catch (error) {
  console.error("Failed to query the database:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
