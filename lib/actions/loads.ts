"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import type { LoadStatus } from "@/lib/types";

// Every loads query/mutation is scoped to the signed-in user's
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

function numberOrNull(formData: FormData, field: string): number | null {
  const raw = String(formData.get(field) ?? "");
  return raw ? Number(raw) : null;
}

export async function createLoad(formData: FormData) {
  const organizationId = await requireOrganizationId();

  const loadNumber = String(formData.get("loadNumber") ?? "").trim();
  if (!loadNumber) {
    throw new Error("Load number is required.");
  }

  await query(
    `insert into loads (
      organization_id, load_number, broker_id, carrier_id, origin, destination,
      pickup_date, pickup_time, delivery_date, delivery_time, commodity,
      weight, trailer_type, loaded_miles, deadhead_miles, rate,
      fuel_estimate, tolls, status, notes
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
    [
      organizationId,
      loadNumber,
      String(formData.get("brokerId") ?? "") || null,
      String(formData.get("carrierId") ?? "") || null,
      String(formData.get("origin") ?? "") || null,
      String(formData.get("destination") ?? "") || null,
      String(formData.get("pickupDate") ?? "") || null,
      String(formData.get("pickupTime") ?? "") || null,
      String(formData.get("deliveryDate") ?? "") || null,
      String(formData.get("deliveryTime") ?? "") || null,
      String(formData.get("commodity") ?? "") || null,
      numberOrNull(formData, "weight"),
      String(formData.get("trailerType") ?? "") || null,
      numberOrNull(formData, "loadedMiles"),
      numberOrNull(formData, "deadheadMiles"),
      numberOrNull(formData, "rate"),
      numberOrNull(formData, "fuelEstimate"),
      numberOrNull(formData, "tolls"),
      String(formData.get("status") ?? "potential") as LoadStatus,
      String(formData.get("notes") ?? "") || null,
    ],
  );

  revalidatePath("/loads");
  redirect("/loads");
}

export async function updateLoad(loadId: string, formData: FormData) {
  const organizationId = await requireOrganizationId();

  const loadNumber = String(formData.get("loadNumber") ?? "").trim();
  if (!loadNumber) {
    throw new Error("Load number is required.");
  }

  await query(
    `update loads set
      load_number = $1, broker_id = $2, carrier_id = $3, truck_id = $4,
      driver_id = $5, origin = $6, destination = $7, pickup_date = $8,
      pickup_time = $9, delivery_date = $10, delivery_time = $11,
      commodity = $12, weight = $13, trailer_type = $14, loaded_miles = $15,
      deadhead_miles = $16, rate = $17, fuel_estimate = $18, tolls = $19,
      status = $20, notes = $21
    where id = $22 and organization_id = $23`,
    [
      loadNumber,
      String(formData.get("brokerId") ?? "") || null,
      String(formData.get("carrierId") ?? "") || null,
      String(formData.get("truckId") ?? "") || null,
      String(formData.get("driverId") ?? "") || null,
      String(formData.get("origin") ?? "") || null,
      String(formData.get("destination") ?? "") || null,
      String(formData.get("pickupDate") ?? "") || null,
      String(formData.get("pickupTime") ?? "") || null,
      String(formData.get("deliveryDate") ?? "") || null,
      String(formData.get("deliveryTime") ?? "") || null,
      String(formData.get("commodity") ?? "") || null,
      numberOrNull(formData, "weight"),
      String(formData.get("trailerType") ?? "") || null,
      numberOrNull(formData, "loadedMiles"),
      numberOrNull(formData, "deadheadMiles"),
      numberOrNull(formData, "rate"),
      numberOrNull(formData, "fuelEstimate"),
      numberOrNull(formData, "tolls"),
      String(formData.get("status") ?? "potential") as LoadStatus,
      String(formData.get("notes") ?? "") || null,
      loadId,
      organizationId,
    ],
  );

  revalidatePath("/loads");
  revalidatePath(`/loads/${loadId}/edit`);
  redirect("/loads");
}

export async function updateLoadStatus(loadId: string, status: LoadStatus) {
  const organizationId = await requireOrganizationId();

  await query(
    "update loads set status = $1 where id = $2 and organization_id = $3",
    [status, loadId, organizationId],
  );

  revalidatePath("/loads");
}
