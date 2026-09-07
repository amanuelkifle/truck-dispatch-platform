import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { createDriver } from "@/lib/actions/drivers";

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

export default async function NewDriverPage() {
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

  const carriers = organizationId
    ? await query<{ id: string; name: string }>(
        "select id, name from carriers where organization_id = $1 order by name",
        [organizationId],
      )
    : [];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <Link href="/drivers" className="text-sm text-neutral-500 hover:underline">
          &larr; Drivers
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New driver</h1>
      </div>

      <form action={createDriver} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            First name *
            <input name="firstName" type="text" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Last name *
            <input name="lastName" type="text" required className={inputClass} />
          </label>
        </div>

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
          {carriers.length === 0 && (
            <span className="text-xs text-neutral-500">
              No carriers yet —{" "}
              <Link href="/carriers/new" className="underline">
                add one first
              </Link>{" "}
              if this driver belongs to one.
            </span>
          )}
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
            Current location
            <input name="currentLocation" type="text" placeholder="City, ST" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Home location
            <input name="homeLocation" type="text" placeholder="City, ST" className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Available date
            <input name="availableDate" type="date" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Hours available
            <input name="hoursAvailable" type="number" step="0.5" className={inputClass} />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Home-time requirement
          <input name="homeTimeRequirement" type="text" placeholder="e.g. Home every weekend" className={inputClass} />
        </label>

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
          <select name="status" defaultValue="active" className={inputClass}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On leave</option>
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
            Create driver
          </button>
          <Link
            href="/drivers"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
