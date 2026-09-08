import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { updateBrokerStatus } from "@/lib/actions/brokers";
import type { BrokerStatus } from "@/lib/types";

const STATUS_OPTIONS: BrokerStatus[] = ["pending", "active", "inactive", "suspended"];

const STATUS_STYLES: Record<BrokerStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  inactive:
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

interface BrokerRow {
  id: string;
  name: string;
  mc_number: string | null;
  dot_number: string | null;
  phone: string | null;
  email: string | null;
  payment_terms: string | null;
  credit_rating: string | null;
  status: BrokerStatus;
}

export default async function BrokersPage() {
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

  const brokers = organizationId
    ? await query<BrokerRow>(
        `select id, name, mc_number, dot_number, phone, email,
                payment_terms, credit_rating, status
         from brokers
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
          <h1 className="text-2xl font-semibold tracking-tight">Brokers</h1>
        </div>
        <Link
          href="/brokers/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          New broker
        </Link>
      </div>

      {brokers.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No brokers yet.{" "}
          <Link href="/brokers/new" className="underline">
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
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Payment terms</th>
                <th className="px-4 py-2 font-medium">Credit rating</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {brokers.map((broker) => (
                <tr
                  key={broker.id}
                  className="border-t border-neutral-100 dark:border-neutral-800"
                >
                  <td className="px-4 py-3 font-medium">{broker.name}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {broker.mc_number || "—"} / {broker.dot_number || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{broker.phone || "—"}</td>
                  <td className="px-4 py-3 text-neutral-500">{broker.email || "—"}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {broker.payment_terms || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {broker.credit_rating || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={async (formData) => {
                        "use server";
                        await updateBrokerStatus(
                          broker.id,
                          formData.get("status") as BrokerStatus,
                        );
                      }}
                      className="flex items-center gap-2"
                    >
                      <select
                        name="status"
                        defaultValue={broker.status}
                        className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${STATUS_STYLES[broker.status]}`}
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
