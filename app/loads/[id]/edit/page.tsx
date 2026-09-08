import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { updateLoad } from "@/lib/actions/loads";
import type { EquipmentType, LoadStatus } from "@/lib/types";

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

interface LoadDetail {
  id: string;
  load_number: string;
  broker_id: string | null;
  carrier_id: string | null;
  truck_id: string | null;
  driver_id: string | null;
  origin: string | null;
  destination: string | null;
  pickup_date: string | null;
  pickup_time: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  commodity: string | null;
  weight: string | null;
  trailer_type: EquipmentType | null;
  loaded_miles: string | null;
  deadhead_miles: string | null;
  rate: string | null;
  fuel_estimate: string | null;
  tolls: string | null;
  status: LoadStatus;
  notes: string | null;
}

export default async function EditLoadPage({
  params,
}: {
  params: { id: string };
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

  if (!organizationId) {
    notFound();
  }

  const loads = await query<LoadDetail>(
    `select id, load_number, broker_id, carrier_id, truck_id, driver_id,
            origin, destination, pickup_date, pickup_time, delivery_date,
            delivery_time, commodity, weight, trailer_type, loaded_miles,
            deadhead_miles, rate, fuel_estimate, tolls, status, notes
     from loads
     where id = $1 and organization_id = $2`,
    [params.id, organizationId],
  );
  const load = loads[0];

  if (!load) {
    notFound();
  }

  const [brokers, carriers, trucks, drivers] = await Promise.all([
    query<{ id: string; name: string }>(
      "select id, name from brokers where organization_id = $1 order by name",
      [organizationId],
    ),
    query<{ id: string; name: string }>(
      "select id, name from carriers where organization_id = $1 order by name",
      [organizationId],
    ),
    query<{ id: string; truck_number: string }>(
      "select id, truck_number from trucks where organization_id = $1 order by truck_number",
      [organizationId],
    ),
    query<{ id: string; first_name: string; last_name: string }>(
      "select id, first_name, last_name from drivers where organization_id = $1 order by last_name",
      [organizationId],
    ),
  ]);

  const updateThisLoad = updateLoad.bind(null, load.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <Link href="/loads" className="text-sm text-neutral-500 hover:underline">
          &larr; Loads
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit load {load.load_number}
        </h1>
      </div>

      <form action={updateThisLoad} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Load number *
          <input
            name="loadNumber"
            type="text"
            required
            defaultValue={load.load_number}
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Broker
            <select
              name="brokerId"
              defaultValue={load.broker_id ?? ""}
              className={inputClass}
            >
              <option value="">— none —</option>
              {brokers.map((broker) => (
                <option key={broker.id} value={broker.id}>
                  {broker.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Carrier
            <select
              name="carrierId"
              defaultValue={load.carrier_id ?? ""}
              className={inputClass}
            >
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
            Truck
            <select
              name="truckId"
              defaultValue={load.truck_id ?? ""}
              className={inputClass}
            >
              <option value="">— unassigned —</option>
              {trucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {truck.truck_number}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Driver
            <select
              name="driverId"
              defaultValue={load.driver_id ?? ""}
              className={inputClass}
            >
              <option value="">— unassigned —</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.first_name} {driver.last_name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Origin
            <input
              name="origin"
              type="text"
              defaultValue={load.origin ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Destination
            <input
              name="destination"
              type="text"
              defaultValue={load.destination ?? ""}
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Pickup date
            <input
              name="pickupDate"
              type="date"
              defaultValue={load.pickup_date ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Pickup time
            <input
              name="pickupTime"
              type="time"
              defaultValue={load.pickup_time ?? ""}
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Delivery date
            <input
              name="deliveryDate"
              type="date"
              defaultValue={load.delivery_date ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Delivery time
            <input
              name="deliveryTime"
              type="time"
              defaultValue={load.delivery_time ?? ""}
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Commodity
            <input
              name="commodity"
              type="text"
              defaultValue={load.commodity ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Weight (lbs)
            <input
              name="weight"
              type="number"
              step="1"
              defaultValue={load.weight ?? ""}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Trailer type
          <select
            name="trailerType"
            defaultValue={load.trailer_type ?? "dry_van"}
            className={inputClass}
          >
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
            <input
              name="loadedMiles"
              type="number"
              step="1"
              defaultValue={load.loaded_miles ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Deadhead miles
            <input
              name="deadheadMiles"
              type="number"
              step="1"
              defaultValue={load.deadhead_miles ?? ""}
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Rate ($)
            <input
              name="rate"
              type="number"
              step="0.01"
              defaultValue={load.rate ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Fuel estimate ($)
            <input
              name="fuelEstimate"
              type="number"
              step="0.01"
              defaultValue={load.fuel_estimate ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Tolls ($)
            <input
              name="tolls"
              type="number"
              step="0.01"
              defaultValue={load.tolls ?? ""}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Status
          <select name="status" defaultValue={load.status} className={inputClass}>
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
          <textarea
            name="notes"
            rows={3}
            defaultValue={load.notes ?? ""}
            className={inputClass}
          />
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Save changes
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
