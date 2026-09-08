"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, DOCUMENTS_BUCKET } from "@/lib/supabase/admin";
import { query } from "@/lib/db";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB - matches next.config.mjs's serverActions.bodySizeLimit

async function requireOrganizationId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rows = await query<{ organization_id: string }>(
    "select organization_id from users where id = $1",
    [user.id],
  );

  if (rows.length === 0) {
    throw new Error(
      "No organization is linked to this account yet. Sign out and sign back in, or contact support.",
    );
  }

  return rows[0].organization_id;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadDocument(formData: FormData) {
  const organizationId = await requireOrganizationId();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a file to upload.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File is too large - the limit is 10MB.");
  }

  const documentType = String(formData.get("documentType") ?? "other");
  const loadId = String(formData.get("loadId") ?? "") || null;
  const carrierId = String(formData.get("carrierId") ?? "") || null;
  const driverId = String(formData.get("driverId") ?? "") || null;
  const truckId = String(formData.get("truckId") ?? "") || null;
  const brokerId = String(formData.get("brokerId") ?? "") || null;

  const storageKey = `${organizationId}/${randomUUID()}-${sanitizeFilename(file.name)}`;

  const admin = createAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storageKey, arrayBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `Upload failed: ${uploadError.message}. Make sure a private "${DOCUMENTS_BUCKET}" bucket exists in Supabase Storage.`,
    );
  }

  await query(
    `insert into documents (
      organization_id, document_type, carrier_id, driver_id, truck_id,
      load_id, broker_id, storage_key, file_name, file_size, content_type
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      organizationId,
      documentType,
      carrierId,
      driverId,
      truckId,
      loadId,
      brokerId,
      storageKey,
      file.name,
      file.size,
      file.type || null,
    ],
  );

  revalidatePath("/documents");
  if (loadId) {
    revalidatePath(`/loads/${loadId}/edit`);
    redirect(`/loads/${loadId}/edit`);
  }
  redirect("/documents");
}

export async function deleteDocument(documentId: string) {
  const organizationId = await requireOrganizationId();

  const rows = await query<{ storage_key: string; load_id: string | null }>(
    "select storage_key, load_id from documents where id = $1 and organization_id = $2",
    [documentId, organizationId],
  );
  const doc = rows[0];
  if (!doc) {
    return;
  }

  const admin = createAdminClient();
  await admin.storage.from(DOCUMENTS_BUCKET).remove([doc.storage_key]);

  await query(
    "delete from documents where id = $1 and organization_id = $2",
    [documentId, organizationId],
  );

  revalidatePath("/documents");
  if (doc.load_id) {
    revalidatePath(`/loads/${doc.load_id}/edit`);
  }
}
