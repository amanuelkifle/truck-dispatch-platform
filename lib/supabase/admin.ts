import { createClient } from "@supabase/supabase-js";

// Privileged Supabase client for server-only code (Server Actions, Route
// Handlers) that needs to read/write Storage regardless of the signed-in
// user's session - the same trust model this app already uses for
// Postgres (lib/db.ts connects as the `postgres` owner role and the app
// enforces organization_id scoping itself, rather than relying on RLS).
// NEVER import this from a Client Component or expose it to the browser -
// the service role key bypasses all Storage access rules.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be " +
        "set to use Supabase Storage (document uploads).",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const DOCUMENTS_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "documents";
