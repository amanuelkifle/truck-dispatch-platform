import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { updateTruckStatus } from "@/lib/actions/trucks";
import { calculateLoadProfitability } from "@/lib/types";
import type { TruckStatus } from "@/lib/types";

// Section 10 (Dispatch Board): a truck-availability kanban, grouped by truck
// status, where each card shows the truck's current active load (if any) and
// supports the same inline status-update pattern used on /trucks. Extends
// the plan's suggested 6 columns to all 8 TruckStatus values so nothing
// (at_delivery, out_of_service) is hidden from dispatch.
const COLUMNS: { status: TruckStatus; label: string }[] = [
  { status: "available", label: "Available" },
  { status: "searching", label: "Searching" },
  { status: "booked", label: "Booked" },
  { status: "at_pickup", label: "At Pickup" },
  { status: "in_transit", label: "In Transit" },
  { status: "at_delivery", label: "At Delivery" },
  { status: "delivered", label: "Delivered" },
  { status: "out_of_service", label: "Out of Service" },
];

const STATUS_OPTIONS: TruckStatus[] = COLUMNS.map((c) => c.status);

const COLUMN_STYLES: Record<TruckStatus, string> = {
  available: "border-green-200 dark:border-green-900",
  searching: "border-blue-200 dark:border-blue-900",
  booked: "border-amber-200 dark:border-amber-900",
  at_pickup: "border-amber-200 dark:border-amber-900",
  in_transit: "border-purple-200 dark:border-purple-900",
  at_delivery: "border-purple-200 dark:border-purple-900",
  delivered: "border-neutral-200 dark:border-neutral-800",
  out_of_service: "border-red-200 dark:border-red-900",
};

const STATUS_PILL_STYLES: Record<TruckStatus, string> = {
  available: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  searching: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  booked: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  at_pickup: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  in_transit:
    "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  at_delivery:
    "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  delivered:
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  out_of_service: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

interface TruckBoardRow {
  id: string;
  truck_number: string;
  carrier_name: string | null;
  driver_name: string | null;
  current_city: string | null;
  current_state: string | null;
  available_date: string | null;
  status: TruckStatus;
  load_id: string | null;
  load_number: string | null;
  destination: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  rate: string | null;
  loaded_miles: string | null;
  deadhead_miles: string | null;
}

interface UpcomingPickupRow {
  id: string;
  load_number: string;
  origin: string | null;
  destination: string | null;
  pickup_date: string | null;
  pickup_time: string | null;
  carrier_name: string | null;
  truck_number: string | null;
  driver_name: string | null;
}

interface UpcomingDeliveryRow {
  id: string;
  load_number: string;
  origin: string | null;
  destination: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  carrier_name: string | null;
  truck_number: string | null;
  driver_name: string | null;
}

function toNumber(value: string | null): number {
  return value ? Number(value) : 0;
}

export default async function DispatchBoardPage() {
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

  const [trucks, upcomingPickups, upcomingDeliveries, activeLoadsRows] =
    organizationId
      ? await Promise.all([
          query<TruckBoardRow>(
            `select t.id, t.truck_number, c.name as carrier_name,
                    (d.first_name || ' ' || d.last_name) as driver_name,
                    t.current_city, t.current_state, t.available_date, t.status,
                    l.id as load_id, l.load_number, l.destination,
                    l.pickup_date, l.delivery_date, l.rate,
                    l.loaded_miles, l.deadhead_miles
             from trucks t
             left join carriers c on c.id = t.carrier_id
             left join drivers d on d.id = t.driver_id
             left join lateral (
               select *
               from loads lo
               where lo.truck_id = t.id
                 and lo.status not in ('delivered', 'invoiced', 'paid', 'cancelled')
               order by lo.created_at desc
               limit 1
             ) l on true
             where t.organization_id = $1
             order by t.truck_number`,
            [organizationId],
          ),
          query<UpcomingPickupRow>(
            `select l.id, l.load_number, l.origin, l.destination,
                    l.pickup_date, l.pickup_time, c.name as carrier_name,
                    t.truck_number,
                    (d.first_name || ' ' || d.last_name) as driver_name
             from loads l
             left join carriers c on c.id = l.carrier_id
             left join trucks t on t.id = l.truck_id
             left join drivers d on d.id = l.driver_id
             where l.organization_id = $1
               and l.status in ('booked', 'dispatched')
             order by l.pickup_date asc nulls last, l.pickup_time asc nulls last
             limit 10`,
            [organizationId],
          ),
          query<UpcomingDeliveryRow>(
            `select l.id, l.load_number, l.origin, l.destination,
                    l.delivery_date, l.delivery_time, c.name as carrier_name,
                    t.truck_number,
                    (d.first_name || ' ' || d.last_name) as driver_name
             from loads l
             left join carriers c on c.id = l.carrier_id
             left join trucks t on t.id = l.truck_id
             left join drivers d on d.id = l.driver_id
             where l.organization_id = $1
               and l.status in ('at_pickup', 'loaded', 'in_transit', 'at_delivery')
             order by l.delivery_date asc nulls last, l.delivery_time asc nulls last
             limit 10`,
            [organizationId],
          ),
          query<{ count: string }>(
            `select count(*) as count from loads
             where organization_id = $1
               and status not in ('delivered', 'invoiced', 'paid', 'cancelled')`,
            [organizationId],
          ),
        ])
      : [[], [], [], [{ count: "0" }]];

  const activeLoadsCount = Number(activeLoadsRows[0]?.count ?? 0);
  const availableCount = trucks.filter((t) => t.status === "available").length;

  return (
    <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Dispatch Board</h1>
        </div>
        <Link
          href="/loads/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          New load
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Trucks</p>
          <p className="text-xl font-semibold">{trucks.length}</p>
        </div>
        <div className="rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Available now</p>
          <p className="text-xl font-semibold">{availableCount}</p>
        </div>
        <div className="rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Active loads</p>
          <p className="text-xl font-semibold">{activeLoadsCount}</p>
        </div>
      </div>

      {trucks.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No trucks yet.{" "}
          <Link href="/trucks/new" className="underline">
            Add one
          </Link>{" "}
          to see the board.
        </p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {COLUMNS.map((column) => {
            const columnTrucks = trucks.filter((t) => t.status === column.status);

            return (
              <div key={column.status} className="flex w-72 flex-shrink-0 flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold">{column.label}</h2>
                  <span className="text-xs text-neutral-500">{columnTrucks.length}</span>
                </div>

                <div className="flex flex-col gap-3">
                  {columnTrucks.map((truck) => {
                    const { effectiveRatePerMile } = calculateLoadProfitability({
                      rate: toNumber(truck.rate),
                      loadedMiles: toNumber(truck.loaded_miles),
                      deadheadMiles: toNumber(truck.deadhead_miles),
                    });

                    return (
                      <div
                        key={truck.id}
                        className={`flex flex-col gap-2 rounded-md border bg-white p-3 text-xs shadow-sm dark:bg-neutral-900 ${COLUMN_STYLES[truck.status]}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{truck.truck_number}</span>
                          {truck.carrier_name && (
                            <span className="text-neutral-500">{truck.carrier_name}</span>
                          )}
                        </div>
                        <p className="text-neutral-500">
                          {truck.driver_name?.trim() || "No driver assigned"}
                        </p>
                        <p className="text-neutral-500">
                          {[truck.current_city, truck.current_state]
                            .filter(Boolean)
                            .join(", ") || "Location unknown"}
                        </p>

                        {truck.load_id ? (
                          <div className="flex flex-col gap-1 rounded-md bg-neutral-50 px-2 py-2 dark:bg-neutral-950">
                            <p className="font-medium">
                              <Link href={`/loads/${truck.load_id}/edit`} className="underline">
                                {truck.load_number}
                              </Link>{" "}
                              &rarr; {truck.destination || "—"}
                            </p>
                            <p className="text-neutral-500">
                              Pickup: {truck.pickup_date || "—"} &middot; Delivery:{" "}
                              {truck.delivery_date || "—"}
                            </p>
                            <p className="text-neutral-500">
                              Rate: {truck.rate ? `$${toNumber(truck.rate).toFixed(2)}` : "—"}
                              {" · RPM: "}
                              {effectiveRatePerMile > 0
                                ? `$${effectiveRatePerMile.toFixed(2)}`
                                : "—"}
                            </p>
                          </div>
                        ) : (
                          <p className="text-neutral-400">
                            No active load &middot; next available{" "}
                            {truck.available_date || "now"}
                          </p>
                        )}

                        <form
                          action={async (formData) => {
                            "use server";
                            await updateTruckStatus(
                              truck.id,
                              formData.get("status") as TruckStatus,
                            );
                          }}
                          className="flex items-center gap-2 pt-1"
                        >
                          <select
                            name="status"
                            defaultValue={truck.status}
                            className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${STATUS_PILL_STYLES[truck.status]}`}
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
                      </div>
                    );
                  })}

                  {columnTrucks.length === 0 && (
                    <p className="rounded-md border border-dashed border-neutral-200 px-3 py-4 text-center text-neutral-400 dark:border-neutral-800">
                      Empty
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Upcoming pickups</h2>
          {upcomingPickups.length === 0 ? (
            <p className="text-sm text-neutral-500">Nothing booked or dispatched yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-neutral-900">
                  <tr>
                    <th className="px-3 py-2 font-medium">Load #</th>
                    <th className="px-3 py-2 font-medium">Origin</th>
                    <th className="px-3 py-2 font-medium">Pickup</th>
                    <th className="px-3 py-2 font-medium">Truck / Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingPickups.map((row) => (
                    <tr key={row.id} className="border-t border-neutral-100 dark:border-neutral-800">
                      <td className="px-3 py-2">
                        <Link href={`/loads/${row.id}/edit`} className="underline">
                          {row.load_number}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-neutral-500">{row.origin || "—"}</td>
                      <td className="px-3 py-2 text-neutral-500">
                        {row.pickup_date || "—"} {row.pickup_time || ""}
                      </td>
                      <td className="px-3 py-2 text-neutral-500">
                        {row.truck_number || "—"} / {row.driver_name?.trim() || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Upcoming deliveries</h2>
          {upcomingDeliveries.length === 0 ? (
            <p className="text-sm text-neutral-500">Nothing in transit yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-neutral-900">
                  <tr>
                    <th className="px-3 py-2 font-medium">Load #</th>
                    <th className="px-3 py-2 font-medium">Destination</th>
                    <th className="px-3 py-2 font-medium">Delivery</th>
                    <th className="px-3 py-2 font-medium">Truck / Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingDeliveries.map((row) => (
                    <tr key={row.id} className="border-t border-neutral-100 dark:border-neutral-800">
                      <td className="px-3 py-2">
                        <Link href={`/loads/${row.id}/edit`} className="underline">
                          {row.load_number}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-neutral-500">{row.destination || "—"}</td>
                      <td className="px-3 py-2 text-neutral-500">
                        {row.delivery_date || "—"} {row.delivery_time || ""}
                      </td>
                      <td className="px-3 py-2 text-neutral-500">
                        {row.truck_number || "—"} / {row.driver_name?.trim() || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
