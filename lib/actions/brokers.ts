"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import type { BrokerStatus } from "@/lib/types";

// Every brokers query/mutation is scoped to the signed-in user's
// organization_id (section 24: tenant isolation) - looked up fresh each
// time rather than trusting a client-supplied value.
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

export async function createBroker(formData: FormData) {
  const organizationId = await requireOrganizationId();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Broker name is required.");
  }

  await query(
    `insert into brokers (
      organization_id, name, mc_number, dot_number, phone, email, website,
      payment_terms, credit_rating, notes, status
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      organizationId,
      name,
      String(formData.get("mcNumber") ?? "") || null,
      String(formData.get("dotNumber") ?? "") || null,
      String(formData.get("phone") ?? "") || null,
      String(formData.get("email") ?? "") || null,
      String(formData.get("website") ?? "") || null,
      String(formData.get("paymentTerms") ?? "") || null,
      String(formData.get("creditRating") ?? "") || null,
      String(formData.get("notes") ?? "") || null,
      String(formData.get("status") ?? "active") as BrokerStatus,
    ],
  );

  revalidatePath("/brokers");
  redirect("/brokers");
}

export async function updateBrokerStatus(brokerId: string, status: BrokerStatus) {
  const organizationId = await requireOrganizationId();

  await query(
    "update brokers set status = $1 where id = $2 and organization_id = $3",
    [status, brokerId, organizationId],
  );

  revalidatePath("/brokers");
}
