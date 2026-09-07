import Link from "next/link";
import { createCarrier } from "@/lib/actions/carriers";

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

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

export default function NewCarrierPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <Link href="/carriers" className="text-sm text-neutral-500 hover:underline">
          &larr; Carriers
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New carrier</h1>
      </div>

      <form action={createCarrier} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Carrier name *
          <input name="name" type="text" required className={inputClass} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            MC number
            <input name="mcNumber" type="text" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            DOT number
            <input name="dotNumber" type="text" className={inputClass} />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Address
          <input name="address" type="text" className={inputClass} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Phone
            <input name="phone" type="tel" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input name="email" type="email" className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Dispatcher
            <input name="dispatcher" type="text" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Home state
            <input name="homeState" type="text" placeholder="e.g. GA" className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Insurance expiration
            <input name="insuranceExpiration" type="date" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Authority status
            <input name="authorityStatus" type="text" className={inputClass} />
          </label>
        </div>

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1">Equipment types</legend>
          <div className="grid grid-cols-3 gap-2">
            {EQUIPMENT_TYPES.map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input type="checkbox" name="equipmentTypes" value={value} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1 text-sm">
          Preferred lanes
          <input
            name="preferredLanes"
            type="text"
            placeholder="Atlanta-Nashville, Atlanta-Charlotte (comma separated)"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Status
          <select name="status" defaultValue="pending" className={inputClass}>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Notes
          <textarea name="notes" rows={3} className={inputClass} />
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Create carrier
          </button>
          <Link
            href="/carriers"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
