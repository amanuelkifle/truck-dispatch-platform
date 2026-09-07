"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import type { DriverStatus } from "@/lib/types";

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

function parseLanes(formData: FormData): string[] {
  const raw = String(formData.get("preferredLanes") ?? "");
  return raw
    .split(",")
    .map((lane) => lane.trim())
    .filter(Boolean);
}

export async function createDriver(formData: FormData) {
  const organizationId = await requireOrganizationId();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!firstName || !lastName) {
    throw new Error("First and last name are required.");
  }

  const carrierId = String(formData.get("carrierId") ?? "") || null;
  const hoursAvailableRaw = String(formData.get("hoursAvailable") ?? "");

  await query(
    `insert into drivers (
      organization_id, carrier_id, first_name, last_name, phone, email,
      current_location, home_location, available_date, preferred_lanes,
      home_time_requirement, hours_available, notes, status
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      organizationId,
      carrierId,
      firstName,
      lastName,
      String(formData.get("phone") ?? "") || null,
      String(formData.get("email") ?? "") || null,
      String(formData.get("currentLocation") ?? "") || null,
      String(formData.get("homeLocation") ?? "") || null,
      String(formData.get("availableDate") ?? "") || null,
      parseLanes(formData),
      String(formData.get("homeTimeRequirement") ?? "") || null,
      hoursAvailableRaw ? Number(hoursAvailableRaw) : null,
      String(formData.get("notes") ?? "") || null,
      String(formData.get("status") ?? "active") as DriverStatus,
    ],
  );

  revalidatePath("/drivers");
  redirect("/drivers");
}

export async function updateDriverStatus(driverId: string, status: DriverStatus) {
  const organizationId = await requireOrganizationId();

  await query(
    "update drivers set status = $1 where id = $2 and organization_id = $3",
    [status, driverId, organizationId],
  );

  revalidatePath("/drivers");
}
