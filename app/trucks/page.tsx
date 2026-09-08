import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { updateTruckStatus, updateTruckLocation } from "@/lib/actions/trucks";
import type { TruckStatus } from "@/lib/types";

const STATUS_OPTIONS: TruckStatus[] = [
  "available",
  "searching",
  "booked",
  "at_pickup",
  "in_transit",
  "at_delivery",
  "delivered",
  "out_of_service",
];

const STATUS_STYLES: Record<TruckStatus, string> = {
  available: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  searching: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  booked: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  at_pickup: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  in_transit: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  at_delivery: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  delivered: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  out_of_service: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

interface TruckRow {
  id: string;
  truck_number: string;
  carrier_name: string | null;
  driver_name: string | null;
  equipment_type: string;
  trailer_number: string | null;
  current_city: string | null;
  current_state: string | null;
  available_date: string | null;
  status: TruckStatus;
}

export default async function TrucksPage() {
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

  const trucks = organizationId
    ? await query<TruckRow>(
        `select t.id, t.truck_number, c.name as carrier_name,
                (d.first_name || ' ' || d.last_name) as driver_name,
                t.equipment_type, t.trailer_number, t.current_city,
                t.current_state, t.available_date, t.status
         from trucks t
         left join carriers c on c.id = t.carrier_id
         left join drivers d on d.id = t.driver_id
         where t.organization_id = $1
         order by t.truck_number`,
        [organizationId],
      )
    : [];

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Trucks</h1>
        </div>
        <Link
          href="/trucks/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          New truck
        </Link>
      </div>

      {trucks.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No trucks yet.{" "}
          <Link href="/trucks/new" className="underline">
            Add your first one
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Truck #</th>
                <th className="px-4 py-2 font-medium">Carrier</th>
                <th className="px-4 py-2 font-medium">Driver</th>
                <th className="px-4 py-2 font-medium">Equipment</th>
                <th className="px-4 py-2 font-medium">Current location</th>
                <th className="px-4 py-2 font-medium">Available</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {trucks.map((truck) => (
                <tr
                  key={truck.id}
                  className="border-t border-neutral-100 dark:border-neutral-800"
                >
                  <td className="px-4 py-3 font-medium">{truck.truck_number}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {truck.carrier_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {truck.driver_name?.trim() || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {truck.equipment_type}
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={async (formData) => {
                        "use server";
                        await updateTruckLocation(
                          truck.id,
                          String(formData.get("currentCity") ?? ""),
                          String(formData.get("currentState") ?? ""),
                        );
                      }}
                      className="flex items-center gap-1"
                    >
                      <input
                        name="currentCity"
                        type="text"
                        defaultValue={truck.current_city ?? ""}
                        placeholder="City"
                        className="w-20 rounded-md border border-neutral-300 bg-transparent px-1.5 py-1 text-xs dark:border-neutral-700"
                      />
                      <input
                        name="currentState"
                        type="text"
                        defaultValue={truck.current_state ?? ""}
                        placeholder="ST"
                        className="w-12 rounded-md border border-neutral-300 bg-transparent px-1.5 py-1 text-xs dark:border-neutral-700"
                      />
                      <button
                        type="submit"
                        className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                      >
                        save
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {truck.available_date || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={async (formData) => {
                        "use server";
                        await updateTruckStatus(
                          truck.id,
                          formData.get("status") as TruckStatus,
                        );
                      }}
                      className="flex items-center gap-2"
                    >
                      <select
                        name="status"
                        defaultValue={truck.status}
                        className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${STATUS_STYLES[truck.status]}`}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                      >
                        save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
