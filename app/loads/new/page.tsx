import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { createLoad } from "@/lib/actions/loads";

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

const EQUIPMENT_TYPES = [
  ["dry_van", "Dry Van"],
  ["reefer", "Reefer"],
  ["flatbed", "Flatbed"],
  ["step_deck", "Step Deck"],
  ["power_only", "Power Only"],
  ["box_truck", "Box Truck"],
  ["hotshot", "Hotshot"],
  ["rgn", "RGN"],
  ["other", "Other"],
] as const;

export default async function NewLoadPage() {
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

  const [brokers, carriers] = organizationId
    ? await Promise.all([
        query<{ id: string; name: string }>(
          "select id, name from brokers where organization_id = $1 order by name",
          [organizationId],
        ),
        query<{ id: string; name: string }>(
          "select id, name from carriers where organization_id = $1 order by name",
          [organizationId],
        ),
      ])
    : [[] as { id: string; name: string }[], [] as { id: string; name: string }[]];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <Link href="/loads" className="text-sm text-neutral-500 hover:underline">
          &larr; Loads
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New load</h1>
      </div>

      <form action={createLoad} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Load number *
          <input name="loadNumber" type="text" required className={inputClass} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Broker
            <select name="brokerId" defaultValue="" className={inputClass}>
              <option value="">— none —</option>
              {brokers.map((broker) => (
                <option key={broker.id} value={broker.id}>
                  {broker.name}
                </option>
              ))}
            </select>
            {brokers.length === 0 && (
              <span className="text-xs text-neutral-500">
                No brokers yet —{" "}
                <Link href="/brokers/new" className="underline">
                  add one first
                </Link>
                .
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Carrier
            <select name="carrierId" defaultValue="" className={inputClass}>
              <option value="">— none —</option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Origin
            <input name="origin" type="text" placeholder="City, ST" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Destination
            <input
              name="destination"
              type="text"
              placeholder="City, ST"
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Pickup date
            <input name="pickupDate" type="date" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Pickup time
            <input name="pickupTime" type="time" className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Delivery date
            <input name="deliveryDate" type="date" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Delivery time
            <input name="deliveryTime" type="time" className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Commodity
            <input name="commodity" type="text" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Weight (lbs)
            <input name="weight" type="number" step="1" className={inputClass} />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Trailer type
          <select name="trailerType" defaultValue="dry_van" className={inputClass}>
            {EQUIPMENT_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Loaded miles
            <input name="loadedMiles" type="number" step="1" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Deadhead miles
            <input name="deadheadMiles" type="number" step="1" className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Rate ($)
            <input name="rate" type="number" step="0.01" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Fuel estimate ($)
            <input name="fuelEstimate" type="number" step="0.01" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Tolls ($)
            <input name="tolls" type="number" step="0.01" className={inputClass} />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Status
          <select name="status" defaultValue="potential" className={inputClass}>
            <option value="potential">Potential</option>
            <option value="negotiating">Negotiating</option>
            <option value="booked">Booked</option>
            <option value="dispatched">Dispatched</option>
            <option value="at_pickup">At Pickup</option>
            <option value="loaded">Loaded</option>
            <option value="in_transit">In Transit</option>
            <option value="at_delivery">At Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="invoiced">Invoiced</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Notes
          <textarea name="notes" rows={3} className={inputClass} />
        </label>

        <p className="text-xs text-neutral-500">
          Truck and driver are assigned after the load is created — open it
          from the Loads list and use Edit once it&apos;s booked.
        </p>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Create load
          </button>
          <Link
            href="/loads"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
