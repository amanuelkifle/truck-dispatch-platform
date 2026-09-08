import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { drivingDistancesMiles } from "@/lib/mapbox";
import { calculateLoadScore, countNearbyOrigins } from "@/lib/scoring";
import type { LoadStatus, TruckStatus } from "@/lib/types";

// Phase 7: the dedicated truck/load matching view. Pick one open truck and
// see every unassigned candidate load ranked by the same score used on the
// Loads list - except here the deadhead leg uses a real Mapbox driving
// distance from the truck's current spot (one batched Matrix API call per
// page load, covering every candidate at once) instead of the load's own
// generic deadhead_miles field.

interface OpenTruck {
  id: string;
  truck_number: string;
  carrier_name: string | null;
  driver_name: string | null;
  current_city: string | null;
  current_state: string | null;
  current_latitude: string | null;
  current_longitude: string | null;
  status: TruckStatus;
}

interface CandidateLoad {
  id: string;
  load_number: string;
  broker_name: string | null;
  broker_status: string | null;
  carrier_preferred_lanes: string[] | null;
  origin: string | null;
  destination: string | null;
  origin_latitude: string | null;
  origin_longitude: string | null;
  destination_latitude: string | null;
  destination_longitude: string | null;
  pickup_date: string | null;
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

function scoreColor(score: number): string {
  if (score >= 70) return "text-green-600 dark:text-green-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export default async function MatchingPage({
  searchParams,
}: {
  searchParams: { truckId?: string };
}) {
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

  const openTrucks = organizationId
    ? await query<OpenTruck>(
        `select t.id, t.truck_number, c.name as carrier_name,
                (d.first_name || ' ' || d.last_name) as driver_name,
                t.current_city, t.current_state,
                t.current_latitude, t.current_longitude, t.status
         from trucks t
         left join carriers c on c.id = t.carrier_id
         left join drivers d on d.id = t.driver_id
         where t.organization_id = $1 and t.status in ('available', 'searching')
         order by t.truck_number`,
        [organizationId],
      )
    : [];

  const selectedTruckId = searchParams.truckId || openTrucks[0]?.id;
  const selectedTruck = openTrucks.find((t) => t.id === selectedTruckId) ?? null;

  const [candidates, openLoadOrigins] =
    organizationId && selectedTruck
      ? await Promise.all([
          query<CandidateLoad>(
            `select l.id, l.load_number, b.name as broker_name, b.status as broker_status,
                    c.preferred_lanes as carrier_preferred_lanes,
                    l.origin, l.destination, l.origin_latitude, l.origin_longitude,
                    l.destination_latitude, l.destination_longitude,
                    l.pickup_date, l.rate, l.loaded_miles, l.deadhead_miles,
                    l.fuel_estimate, l.tolls, l.status
             from loads l
             left join brokers b on b.id = l.broker_id
             left join carriers c on c.id = l.carrier_id
             where l.organization_id = $1 and l.truck_id is null
               and l.status in ('potential', 'negotiating', 'booked')
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

  const truckLatLng =
    selectedTruck?.current_latitude && selectedTruck?.current_longitude
      ? {
          lat: Number(selectedTruck.current_latitude),
          lng: Number(selectedTruck.current_longitude),
        }
      : null;

  const candidateOrigins = candidates.map((load) =>
    load.origin_latitude && load.origin_longitude
      ? { lat: Number(load.origin_latitude), lng: Number(load.origin_longitude) }
      : null,
  );

  // One Matrix API call for the whole candidate list, not one per load.
  let drivingDeadheads: (number | null)[] = candidates.map(() => null);
  if (truckLatLng && candidateOrigins.some((o) => o !== null)) {
    const knownIndexes: number[] = [];
    const knownOrigins: { lat: number; lng: number }[] = [];
    candidateOrigins.forEach((o, i) => {
      if (o) {
        knownIndexes.push(i);
        knownOrigins.push(o);
      }
    });
    const distances = await drivingDistancesMiles(truckLatLng, knownOrigins);
    drivingDeadheads = candidates.map(() => null);
    knownIndexes.forEach((originalIndex, i) => {
      drivingDeadheads[originalIndex] = distances[i];
    });
  }

  const scored = candidates.map((load, index) => {
    const destination =
      load.destination_latitude && load.destination_longitude
        ? { lat: Number(load.destination_latitude), lng: Number(load.destination_longitude) }
        : null;
    const reloadCount = countNearbyOrigins(destination, openLoadOrigins, load.id);

    const realDeadhead = drivingDeadheads[index];
    const deadheadMiles = realDeadhead ?? toNumber(load.deadhead_miles);

    const breakdown = calculateLoadScore({
      rate: toNumber(load.rate),
      fuelEstimate: toNumber(load.fuel_estimate),
      tolls: toNumber(load.tolls),
      loadedMiles: toNumber(load.loaded_miles),
      deadheadMiles,
      preferredLanes: load.carrier_preferred_lanes ?? [],
      origin: load.origin,
      destination: load.destination,
      reloadCount,
      brokerStatus: load.broker_status,
    });

    return {
      load,
      breakdown,
      deadheadMiles,
      isLiveDeadhead: realDeadhead !== null,
    };
  });

  scored.sort((a, b) => b.breakdown.overallScore - a.breakdown.overallScore);

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/loads" className="text-sm text-neutral-500 hover:underline">
            &larr; Loads
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Truck / load matching</h1>
        </div>
      </div>

      {openTrucks.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No trucks are marked &ldquo;available&rdquo; or &ldquo;searching&rdquo; right now.{" "}
          <Link href="/trucks" className="underline">
            Update a truck&rsquo;s status
          </Link>{" "}
          to see matches for it here.
        </p>
      ) : (
        <>
          <form
            action="/matching"
            method="GET"
            className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-500">Truck</span>
              <select
                name="truckId"
                defaultValue={selectedTruckId}
                className="min-w-64 rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
              >
                {openTrucks.map((truck) => (
                  <option key={truck.id} value={truck.id}>
                    {truck.truck_number}
                    {truck.driver_name?.trim() ? ` — ${truck.driver_name.trim()}` : ""}
                    {truck.current_city ? ` (${truck.current_city}, ${truck.current_state ?? ""})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
            >
              Show matches
            </button>
          </form>

          {selectedTruck && !truckLatLng && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              Truck {selectedTruck.truck_number} has no geocoded current location, so deadhead below
              falls back to each load&rsquo;s own manual estimate.{" "}
              <Link href="/trucks" className="underline">
                Add a current city/state
              </Link>{" "}
              for live driving-distance deadhead instead.
            </p>
          )}

          {scored.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No unassigned loads (potential, negotiating, or booked) available to match right now.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-neutral-900">
                  <tr>
                    <th className="px-4 py-2 font-medium">Load #</th>
                    <th className="px-4 py-2 font-medium">Broker</th>
                    <th className="px-4 py-2 font-medium">Origin → Destination</th>
                    <th className="px-4 py-2 font-medium">Pickup</th>
                    <th className="px-4 py-2 font-medium">Rate</th>
                    <th className="px-4 py-2 font-medium">Deadhead</th>
                    <th className="px-4 py-2 font-medium">Net RPM</th>
                    <th
                      className="px-4 py-2 font-medium"
                      title="RPM 35% / Deadhead 25% / Reload 20% / Lane 10% / Broker 10%"
                    >
                      Score
                    </th>
                    <th className="px-4 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {scored.map(({ load, breakdown, deadheadMiles, isLiveDeadhead }) => (
                    <tr key={load.id} className="border-t border-neutral-100 dark:border-neutral-800">
                      <td className="px-4 py-3 font-medium">{load.load_number}</td>
                      <td className="px-4 py-3 text-neutral-500">{load.broker_name || "—"}</td>
                      <td className="px-4 py-3 text-neutral-500">
                        {[load.origin, load.destination].filter(Boolean).join(" → ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{load.pickup_date || "—"}</td>
                      <td className="px-4 py-3 text-neutral-500">
                        {load.rate ? `$${toNumber(load.rate).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {deadheadMiles ? `${Math.round(deadheadMiles)} mi` : "—"}
                        <span
                          className={`ml-1 text-xs ${isLiveDeadhead ? "text-green-600 dark:text-green-400" : "text-neutral-400"}`}
                          title={
                            isLiveDeadhead
                              ? "Live Mapbox driving distance"
                              : "Estimated from the load's manual deadhead field"
                          }
                        >
                          {isLiveDeadhead ? "live" : "est."}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {load.rate ? `$${breakdown.netRatePerMile.toFixed(2)}` : "—"}
                      </td>
                      <td className={`px-4 py-3 font-semibold ${scoreColor(breakdown.overallScore)}`}>
                        {load.rate ? breakdown.overallScore : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/loads/${load.id}/edit`} className="text-xs text-neutral-500 underline">
                          assign this truck
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
