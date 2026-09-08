"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { geocode } from "@/lib/mapbox";
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

  const currentCity = String(formData.get("currentCity") ?? "") || null;
  const currentState = String(formData.get("currentState") ?? "") || null;
  const place = [currentCity, currentState].filter(Boolean).join(", ") || null;
  const geo = place ? await geocode(place) : null;

  await query(
    `insert into trucks (
      organization_id, truck_number, carrier_id, driver_id, vin,
      equipment_type, trailer_number, current_city, current_state,
      available_date, available_time, status,
      current_latitude, current_longitude
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      organizationId,
      truckNumber,
      String(formData.get("carrierId") ?? "") || null,
      String(formData.get("driverId") ?? "") || null,
      String(formData.get("vin") ?? "") || null,
      String(formData.get("equipmentType") ?? "other") as EquipmentType,
      String(formData.get("trailerNumber") ?? "") || null,
      currentCity,
      currentState,
      String(formData.get("availableDate") ?? "") || null,
      String(formData.get("availableTime") ?? "") || null,
      String(formData.get("status") ?? "available") as TruckStatus,
      geo?.lat ?? null,
      geo?.lng ?? null,
    ],
  );

  revalidatePath("/trucks");
  redirect("/trucks");
}

// There's no truck edit page yet, so a truck's geocoded location is only
// ever set at creation - if it physically moves, re-geocode it here so the
// matching view (app/matching/page.tsx) isn't scoring against a stale spot.
export async function updateTruckLocation(
  truckId: string,
  currentCity: string,
  currentState: string,
) {
  const organizationId = await requireOrganizationId();
  const place = [currentCity, currentState].filter(Boolean).join(", ") || null;
  const geo = place ? await geocode(place) : null;

  await query(
    `update trucks set current_city = $1, current_state = $2,
      current_latitude = $3, current_longitude = $4
     where id = $5 and organization_id = $6`,
    [
      currentCity || null,
      currentState || null,
      geo?.lat ?? null,
      geo?.lng ?? null,
      truckId,
      organizationId,
    ],
  );

  revalidatePath("/trucks");
  revalidatePath("/matching");
  revalidatePath("/dispatch");
}

export async function updateTruckStatus(truckId: string, status: TruckStatus) {
  const organizationId = await requireOrganizationId();

  await query(
    "update trucks set status = $1 where id = $2 and organization_id = $3",
    [status, truckId, organizationId],
  );

  revalidatePath("/trucks");
}
