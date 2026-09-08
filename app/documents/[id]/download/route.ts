import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, DOCUMENTS_BUCKET } from "@/lib/supabase/admin";
import { query } from "@/lib/db";

// Documents live in a private Supabase Storage bucket - the browser never
// gets direct bucket access. This route authenticates the request the same
// way every page does, confirms the document belongs to the caller's
// organization, then hands back a short-lived signed URL so the actual
// bytes are served straight from Supabase's CDN rather than proxied
// through this function.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const orgRows = await query<{ organization_id: string }>(
    "select organization_id from users where id = $1",
    [user.id],
  );
  const organizationId = orgRows[0]?.organization_id;

  if (!organizationId) {
    return NextResponse.json({ error: "No organization linked to this account." }, { status: 403 });
  }

  const rows = await query<{ storage_key: string }>(
    "select storage_key from documents where id = $1 and organization_id = $2",
    [params.id, organizationId],
  );
  const doc = rows[0];

  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(doc.storage_key, 60);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create a download link." },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
