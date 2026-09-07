import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { updateDriverStatus } from "@/lib/actions/drivers";
import type { DriverStatus } from "@/lib/types";

const STATUS_OPTIONS: DriverStatus[] = ["active", "inactive", "on_leave"];

const STATUS_STYLES: Record<DriverStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  inactive:
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  on_leave:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

interface DriverRow {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  carrier_name: string | null;
  current_location: string | null;
  home_location: string | null;
  available_date: string | null;
  status: DriverStatus;
}

export default async function DriversPage() {
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

  const drivers = organizationId
    ? await query<DriverRow>(
        `select d.id, d.first_name, d.last_name, d.phone,
                c.name as carrier_name, d.current_location, d.home_location,
                d.available_date, d.status
         from drivers d
         left join carriers c on c.id = d.carrier_id
         where d.organization_id = $1
         order by d.last_name, d.first_name`,
        [organizationId],
      )
    : [];

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Drivers</h1>
        </div>
        <Link
          href="/drivers/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          New driver
        </Link>
      </div>

      {drivers.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No drivers yet.{" "}
          <Link href="/drivers/new" className="underline">
            Add your first one
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Carrier</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Current location</th>
                <th className="px-4 py-2 font-medium">Home location</th>
                <th className="px-4 py-2 font-medium">Available</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr
                  key={driver.id}
                  className="border-t border-neutral-100 dark:border-neutral-800"
                >
                  <td className="px-4 py-3 font-medium">
                    {driver.first_name} {driver.last_name}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {driver.carrier_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {driver.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {driver.current_location || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {driver.home_location || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {driver.available_date || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={async (formData) => {
                        "use server";
                        await updateDriverStatus(
                          driver.id,
                          formData.get("status") as DriverStatus,
                        );
                      }}
                      className="flex items-center gap-2"
                    >
                      <select
                        name="status"
                        defaultValue={driver.status}
                        className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${STATUS_STYLES[driver.status]}`}
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
