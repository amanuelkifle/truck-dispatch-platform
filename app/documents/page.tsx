import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { deleteDocument } from "@/lib/actions/documents";
import { DOCUMENT_TYPES } from "@/lib/document-types";

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPES.map((t) => [t.value, t.label]),
);

interface DocumentRow {
  id: string;
  document_type: string;
  file_name: string | null;
  file_size: string | null;
  uploaded_at: string;
  load_number: string | null;
  carrier_name: string | null;
  driver_name: string | null;
  truck_number: string | null;
  broker_name: string | null;
}

function formatBytes(value: string | null): string {
  const bytes = value ? Number(value) : 0;
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function attachedTo(row: DocumentRow): string {
  const parts: string[] = [];
  if (row.load_number) parts.push(`Load ${row.load_number}`);
  if (row.carrier_name) parts.push(`Carrier: ${row.carrier_name}`);
  if (row.driver_name?.trim()) parts.push(`Driver: ${row.driver_name.trim()}`);
  if (row.truck_number) parts.push(`Truck ${row.truck_number}`);
  if (row.broker_name) parts.push(`Broker: ${row.broker_name}`);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export default async function DocumentsPage() {
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

  const documents = organizationId
    ? await query<DocumentRow>(
        `select d.id, d.document_type, d.file_name, d.file_size, d.uploaded_at,
                l.load_number, c.name as carrier_name,
                (dr.first_name || ' ' || dr.last_name) as driver_name,
                t.truck_number, b.name as broker_name
         from documents d
         left join loads l on l.id = d.load_id
         left join carriers c on c.id = d.carrier_id
         left join drivers dr on dr.id = d.driver_id
         left join trucks t on t.id = d.truck_id
         left join brokers b on b.id = d.broker_id
         where d.organization_id = $1
         order by d.uploaded_at desc`,
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
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        </div>
        <Link
          href="/documents/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Upload document
        </Link>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No documents yet.{" "}
          <Link href="/documents/new" className="underline">
            Upload your first one
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">File</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Attached to</th>
                <th className="px-4 py-2 font-medium">Size</th>
                <th className="px-4 py-2 font-medium">Uploaded</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="px-4 py-3 font-medium">{doc.file_name || "(unnamed)"}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {TYPE_LABELS[doc.document_type] ?? doc.document_type}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{attachedTo(doc)}</td>
                  <td className="px-4 py-3 text-neutral-500">{formatBytes(doc.file_size)}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(doc.uploaded_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <a
                        href={`/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-neutral-500 underline"
                      >
                        download
                      </a>
                      <form
                        action={async () => {
                          "use server";
                          await deleteDocument(doc.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          delete
                        </button>
                      </form>
                    </div>
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
