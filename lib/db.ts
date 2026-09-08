import { Pool, types } from "pg";

// By default node-postgres parses DATE columns into JS Date objects, which
// blows up ("Objects are not valid as a React child") the moment a page
// renders one directly - and TypeScript still thinks these fields are
// `string` because that's what our types declare them as. Force DATE (and
// TIME) columns to come back as the plain strings Postgres already sends
// on the wire ("YYYY-MM-DD" / "HH:MM:SS") instead.
types.setTypeParser(types.builtins.DATE, (value: string) => value);
types.setTypeParser(types.builtins.TIME, (value: string) => value);

// Single shared connection pool for the app, created lazily on first use
// (not at module import time) so that build steps which merely load this
// module - like Next.js "collecting page data" - don't fail just because
// DATABASE_URL isn't available in that context.
//
// In serverless environments (Vercel) this pool is reused across
// invocations within the same warm function instance; use a pooled
// connection string (Supabase's "Transaction pooler", port 6543) as
// DATABASE_URL so this plays nicely with many short-lived serverless
// connections.

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (global._pgPool) {
    return global._pgPool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in " +
        "(or, on Vercel, add it under Project Settings -> Environment Variables).",
    );
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  global._pgPool = pool;
  return pool;
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}
