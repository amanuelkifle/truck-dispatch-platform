import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { updateLoadStatus } from "@/lib/actions/loads";
import { calculateLoadScore, countNearbyOrigins } from "@/lib/scoring";
import type { LoadStatus } from "@/lib/types";

const STATUS_OPTIONS: LoadStatus[] = [
  "potential",
  "negotiating",
  "booked",
  "dispatched",
  "at_pickup",
  "loaded",
  "in_transit",
  "at_delivery",
  "delivered",
  "invoiced",
  "paid",
  "cancelled",
];

const STATUS_STYLES: Record<LoadStatus, string> = {
  potential:
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  negotiating: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  booked: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  dispatched: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  at_pickup: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  loaded: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  in_transit:
    "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  at_delivery:
    "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  invoiced: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

function scoreColor(score: number): string {
  if (score >= 70) return "text-green-600 dark:text-green-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

interface LoadRow {
  id: string;
  load_number: string;
  broker_name: string | null;
  broker_status: string | null;
  carrier_name: string | null;
  carrier_preferred_lanes: string[] | null;
  truck_number: string | null;
  driver_name: string | null;
  origin: string | null;
  destination: string | null;
  destination_latitude: string | null;
  destination_longitude: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  rate: string | null;
  loaded_miles: string | null;
  deadhead_miles: string | null;
  fuel_estimate: string | null;
  tolls: string | null;
  status: LoadStatus;
}

interface OpenLoadOrigin {
  id: string;
  originLat: number | null;
  originLng: number | null;
}

function toNumber(value: string | null): number {
  return value ? Number(value) : 0;
}

export default async function LoadsPage() {
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

  const [loads, openLoadOrigins] = organizationId
    ? await Promise.all([
        query<LoadRow>(
          `select l.id, l.load_number, b.name as broker_name, b.status as broker_status,
                  c.name as carrier_name, c.preferred_lanes as carrier_preferred_lanes,
                  t.truck_number, (dr.first_name || ' ' || dr.last_name) as driver_name,
                  l.origin, l.destination, l.destination_latitude, l.destination_longitude,
                  l.pickup_date, l.delivery_date, l.rate, l.loaded_miles, l.deadhead_miles,
                  l.fuel_estimate, l.tolls, l.status
           from loads l
           left join brokers b on b.id = l.broker_id
           left join carriers c on c.id = l.carrier_id
           left join trucks t on t.id = l.truck_id
           left join drivers dr on dr.id = l.driver_id
           where l.organization_id = $1
           order by l.created_at desc`,
          [organizationId],
        ),
        query<OpenLoadOrigin>(
          `select id, origin_latitude as "originLat", origin_longitude as "originLng"
           from loads
           where organization_id = $1 and status in ('potential', 'negotiating')`,
          [organizationId],
        ),
      ])
    : [[], []];

  const scored = loads.map((load) => {
    const destination =
      load.destination_latitude && load.destination_longitude
        ? { lat: Number(load.destination_latitude), lng: Number(load.destination_longitude) }
        : null;
    const reloadCount = countNearbyOrigins(destination, openLoadOrigins, load.id);

    const breakdown = calculateLoadScore({
      rate: toNumber(load.rate),
      fuelEstimate: toNumber(load.fuel_estimate),
      tolls: toNumber(load.tolls),
      loadedMiles: toNumber(load.loaded_miles),
      deadheadMiles: toNumber(load.deadhead_miles),
      preferredLanes: load.carrier_preferred_lanes ?? [],
      origin: load.origin,
      destination: load.destination,
      reloadCount,
      brokerStatus: load.broker_status,
    });

    return { load, breakdown };
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Loads</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/matching"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
          >
            Truck / load matching
          </Link>
          <Link
            href="/loads/new"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            New load
          </Link>
        </div>
      </div>

      {scored.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No loads yet.{" "}
          <Link href="/loads/new" className="underline">
            Add your first one
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Load #</th>
                <th className="px-4 py-2 font-medium">Broker</th>
                <th className="px-4 py-2 font-medium">Carrier</th>
                <th className="px-4 py-2 font-medium">Truck / Driver</th>
                <th className="px-4 py-2 font-medium">Origin → Destination</th>
                <th className="px-4 py-2 font-medium">Pickup</th>
                <th className="px-4 py-2 font-medium">Delivery</th>
                <th className="px-4 py-2 font-medium">Rate</th>
                <th className="px-4 py-2 font-medium">Net RPM</th>
                <th className="px-4 py-2 font-medium" title="RPM 35% / Deadhead 25% / Reload 20% / Lane 10% / Broker 10%">
                  Score
                </th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {scored.map(({ load, breakdown }) => (
                <tr
                  key={load.id}
                  className="border-t border-neutral-100 dark:border-neutral-800"
                >
                  <td className="px-4 py-3 font-medium">{load.load_number}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {load.broker_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {load.carrier_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {load.truck_number || "—"} / {load.driver_name?.trim() || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {[load.origin, load.destination].filter(Boolean).join(" → ") ||
                      "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {load.pickup_date || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {load.delivery_date || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {load.rate ? `$${toNumber(load.rate).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {load.rate ? `$${breakdown.netRatePerMile.toFixed(2)}` : "—"}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${scoreColor(breakdown.overallScore)}`}>
                    {load.rate ? breakdown.overallScore : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={async (formData) => {
                        "use server";
                        await updateLoadStatus(
                          load.id,
                          formData.get("status") as LoadStatus,
                        );
                      }}
                      className="flex items-center gap-2"
                    >
                      <select
                        name="status"
                        defaultValue={load.status}
                        className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${STATUS_STYLES[load.status]}`}
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
                  <td className="px-4 py-3">
                    <Link
                      href={`/loads/${load.id}/edit`}
                      className="text-xs text-neutral-500 underline"
                    >
                      edit
                    </Link>
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
