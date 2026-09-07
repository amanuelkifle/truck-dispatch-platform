import { Pool } from "pg";

// Single shared connection pool for the app. In serverless environments
// (Vercel) this pool is reused across invocations within the same
// function instance; use a pooled connection string (Supabase's
// "Transaction pooler", port 6543) as DATABASE_URL so this plays nicely
// with many short-lived serverless connections.

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
}

// Reuse the pool across hot reloads in dev, and across warm serverless
// invocations in production.
export const pool = global._pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
