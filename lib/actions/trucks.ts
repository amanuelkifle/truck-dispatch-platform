"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import type { EquipmentType, TruckStatus } from "@/lib/types";

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

export async function createTruck(formData: FormData) {
  const organizationId = await requireOrganizationId();

  const truckNumber = String(formData.get("truckNumber") ?? "").trim();
  if (!truckNumber) {
    throw new Error("Truck number is required.");
  }

  await query(
    `insert into trucks (
      organization_id, truck_number, carrier_id, driver_id, vin,
      equipment_type, trailer_number, current_city, current_state,
      available_date, available_time, status
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      organizationId,
      truckNumber,
      String(formData.get("carrierId") ?? "") || null,
      String(formData.get("driverId") ?? "") || null,
      String(formData.get("vin") ?? "") || null,
      String(formData.get("equipmentType") ?? "other") as EquipmentType,
      String(formData.get("trailerNumber") ?? "") || null,
      String(formData.get("currentCity") ?? "") || null,
      String(formData.get("currentState") ?? "") || null,
      String(formData.get("availableDate") ?? "") || null,
      String(formData.get("availableTime") ?? "") || null,
      String(formData.get("status") ?? "available") as TruckStatus,
    ],
  );

  revalidatePath("/trucks");
  redirect("/trucks");
}

export async function updateTruckStatus(truckId: string, status: TruckStatus) {
  const organizationId = await requireOrganizationId();

  await query(
    "update trucks set status = $1 where id = $2 and organization_id = $3",
    [status, truckId, organizationId],
  );

  revalidatePath("/trucks");
}
