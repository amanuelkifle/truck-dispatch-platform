import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { updateCarrierStatus } from "@/lib/actions/carriers";
import type { CarrierStatus } from "@/lib/types";

const STATUS_OPTIONS: CarrierStatus[] = [
  "pending",
  "active",
  "inactive",
  "suspended",
];

const STATUS_STYLES: Record<CarrierStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  inactive:
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

interface CarrierRow {
  id: string;
  name: string;
  mc_number: string | null;
  dot_number: string | null;
  phone: string | null;
  dispatcher: string | null;
  home_state: string | null;
  equipment_types: string[];
  status: CarrierStatus;
}

export default async function CarriersPage() {
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
    ? await query<CarrierRow>(
        `select id, name, mc_number, dot_number, phone, dispatcher,
                home_state, equipment_types, status
         from carriers
         where organization_id = $1
         order by name`,
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
          <h1 className="text-2xl font-semibold tracking-tight">Carriers</h1>
        </div>
        <Link
          href="/carriers/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          New carrier
        </Link>
      </div>

      {carriers.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No carriers yet.{" "}
          <Link href="/carriers/new" className="underline">
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
                <th className="px-4 py-2 font-medium">MC / DOT</th>
                <th className="px-4 py-2 font-medium">Dispatcher</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Home state</th>
                <th className="px-4 py-2 font-medium">Equipment</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {carriers.map((carrier) => (
                <tr
                  key={carrier.id}
                  className="border-t border-neutral-100 dark:border-neutral-800"
                >
                  <td className="px-4 py-3 font-medium">{carrier.name}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {carrier.mc_number || "—"} / {carrier.dot_number || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {carrier.dispatcher || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {carrier.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {carrier.home_state || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {carrier.equipment_types.length > 0
                      ? carrier.equipment_types.join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={async (formData) => {
                        "use server";
                        await updateCarrierStatus(
                          carrier.id,
                          formData.get("status") as CarrierStatus,
                        );
                      }}
                      className="flex items-center gap-2"
                    >
                      <select
                        name="status"
                        defaultValue={carrier.status}
                        className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${STATUS_STYLES[carrier.status]}`}
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
