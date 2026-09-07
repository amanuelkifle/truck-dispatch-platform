"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import type { CarrierStatus, EquipmentType } from "@/lib/types";

// Every carriers query/mutation is scoped to the signed-in user's
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

const EQUIPMENT_TYPES: EquipmentType[] = [
  "dry_van",
  "reefer",
  "flatbed",
  "step_deck",
  "power_only",
  "box_truck",
  "hotshot",
  "rgn",
  "other",
];

function parseEquipmentTypes(formData: FormData): EquipmentType[] {
  return formData
    .getAll("equipmentTypes")
    .map(String)
    .filter((value): value is EquipmentType =>
      EQUIPMENT_TYPES.includes(value as EquipmentType),
    );
}

function parseLanes(formData: FormData): string[] {
  const raw = String(formData.get("preferredLanes") ?? "");
  return raw
    .split(",")
    .map((lane) => lane.trim())
    .filter(Boolean);
}

export async function createCarrier(formData: FormData) {
  const organizationId = await requireOrganizationId();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Carrier name is required.");
  }

  await query(
    `insert into carriers (
      organization_id, name, mc_number, dot_number, address, phone, email,
      dispatcher, insurance_expiration, authority_status, equipment_types,
      preferred_lanes, home_state, notes, status
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      organizationId,
      name,
      String(formData.get("mcNumber") ?? "") || null,
      String(formData.get("dotNumber") ?? "") || null,
      String(formData.get("address") ?? "") || null,
      String(formData.get("phone") ?? "") || null,
      String(formData.get("email") ?? "") || null,
      String(formData.get("dispatcher") ?? "") || null,
      String(formData.get("insuranceExpiration") ?? "") || null,
      String(formData.get("authorityStatus") ?? "") || null,
      parseEquipmentTypes(formData),
      parseLanes(formData),
      String(formData.get("homeState") ?? "") || null,
      String(formData.get("notes") ?? "") || null,
      String(formData.get("status") ?? "pending") as CarrierStatus,
    ],
  );

  revalidatePath("/carriers");
  redirect("/carriers");
}

export async function updateCarrierStatus(carrierId: string, status: CarrierStatus) {
  const organizationId = await requireOrganizationId();

  await query(
    "update carriers set status = $1 where id = $2 and organization_id = $3",
    [status, carrierId, organizationId],
  );

  revalidatePath("/carriers");
}
