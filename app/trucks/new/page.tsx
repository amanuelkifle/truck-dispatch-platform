import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { createTruck } from "@/lib/actions/trucks";

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

export default async function NewTruckPage() {
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

  const [carriers, drivers] = organizationId
    ? await Promise.all([
        query<{ id: string; name: string }>(
          "select id, name from carriers where organization_id = $1 order by name",
          [organizationId],
        ),
        query<{ id: string; first_name: string; last_name: string }>(
          "select id, first_name, last_name from drivers where organization_id = $1 order by last_name",
          [organizationId],
        ),
      ])
    : [
        [] as { id: string; name: string }[],
        [] as { id: string; first_name: string; last_name: string }[],
      ];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <Link href="/trucks" className="text-sm text-neutral-500 hover:underline">
          &larr; Trucks
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New truck</h1>
      </div>

      <form action={createTruck} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Truck number *
            <input name="truckNumber" type="text" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            VIN
            <input name="vin" type="text" className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <label className="flex flex-col gap-1 text-sm">
            Driver
            <select name="driverId" defaultValue="" className={inputClass}>
              <option value="">— none —</option>
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
            Equipment type
            <select name="equipmentType" defaultValue="dry_van" className={inputClass}>
              {EQUIPMENT_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Trailer number
            <input name="trailerNumber" type="text" className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Current city
            <input name="currentCity" type="text" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Current state
            <input name="currentState" type="text" placeholder="e.g. GA" className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Available date
            <input name="availableDate" type="date" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Available time
            <input name="availableTime" type="time" className={inputClass} />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Status
          <select name="status" defaultValue="available" className={inputClass}>
            <option value="available">Available</option>
            <option value="searching">Searching</option>
            <option value="booked">Booked</option>
            <option value="at_pickup">At Pickup</option>
            <option value="in_transit">In Transit</option>
            <option value="at_delivery">At Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="out_of_service">Out of Service</option>
          </select>
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Create truck
          </button>
          <Link
            href="/trucks"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
