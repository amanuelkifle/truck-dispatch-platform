import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { uploadDocument, DOCUMENT_TYPES } from "@/lib/actions/documents";

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: { loadId?: string };
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

  const [loads, carriers, drivers, trucks, brokers] = organizationId
    ? await Promise.all([
        query<{ id: string; load_number: string }>(
          "select id, load_number from loads where organization_id = $1 order by created_at desc",
          [organizationId],
        ),
        query<{ id: string; name: string }>(
          "select id, name from carriers where organization_id = $1 order by name",
          [organizationId],
        ),
        query<{ id: string; first_name: string; last_name: string }>(
          "select id, first_name, last_name from drivers where organization_id = $1 order by last_name",
          [organizationId],
        ),
        query<{ id: string; truck_number: string }>(
          "select id, truck_number from trucks where organization_id = $1 order by truck_number",
          [organizationId],
        ),
        query<{ id: string; name: string }>(
          "select id, name from brokers where organization_id = $1 order by name",
          [organizationId],
        ),
      ])
    : [[], [], [], [], []];

  const defaultLoadId = searchParams.loadId ?? "";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <Link href="/documents" className="text-sm text-neutral-500 hover:underline">
          &larr; Documents
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Upload document</h1>
      </div>

      <form action={uploadDocument} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          File *
          <input
            name="file"
            type="file"
            required
            accept="application/pdf,image/*"
            className={inputClass}
          />
          <span className="text-xs text-neutral-500">PDF or image, up to 10MB.</span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Document type
          <select name="documentType" defaultValue="rate_confirmation" className={inputClass}>
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <p className="text-xs text-neutral-500">
          Optionally link this document to whichever record it belongs to
          (usually just one of these).
        </p>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Load
            <select name="loadId" defaultValue={defaultLoadId} className={inputClass}>
              <option value="">— none —</option>
              {loads.map((load) => (
                <option key={load.id} value={load.id}>
                  {load.load_number}
                </option>
              ))}
            </select>
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

        <div className="grid grid-cols-3 gap-4">
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
          <label className="flex flex-col gap-1 text-sm">
            Truck
            <select name="truckId" defaultValue="" className={inputClass}>
              <option value="">— none —</option>
              {trucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {truck.truck_number}
                </option>
              ))}
            </select>
          </label>
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
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Upload
          </button>
          <Link
            href="/documents"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
