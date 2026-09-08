import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { signOut } from "@/lib/actions/auth";
import type { AppUser, Organization } from "@/lib/types";

// Phase 8 (in-app notifications slice only - see docs/ROADMAP.md for what's
// deferred). No cron/scheduler: every alert here is computed fresh on each
// dashboard page load from data already in the schema, not written to the
// `notifications` table (that table exists in db/schema.sql for a future
// event-driven version of this, but nothing inserts into it yet).

interface InsuranceAlert {
  id: string;
  name: string;
  insurance_expiration: string;
}

interface PickupAlert {
  id: string;
  load_number: string;
  origin: string | null;
  destination: string | null;
  pickup_date: string;
}

interface MissingDocAlert {
  id: string;
  load_number: string;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date(new Date().toDateString());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const appUsers = await query<AppUser>(
    'select id, organization_id as "organizationId", email, role from users where id = $1',
    [user.id],
  );
  const appUser = appUsers[0];

  const organizations = appUser
    ? await query<Organization>(
        'select id, name, created_at as "createdAt" from organizations where id = $1',
        [appUser.organizationId],
      )
    : [];
  const organization = organizations[0];

  const organizationId = appUser?.organizationId;

  const [insuranceAlerts, pickupAlerts, missingPods, missingRateConfirmations] =
    organizationId
      ? await Promise.all([
          query<InsuranceAlert>(
            `select id, name, insurance_expiration
             from carriers
             where organization_id = $1
               and insurance_expiration is not null
               and insurance_expiration <= current_date + interval '30 days'
             order by insurance_expiration
             limit 10`,
            [organizationId],
          ),
          query<PickupAlert>(
            `select id, load_number, origin, destination, pickup_date
             from loads
             where organization_id = $1
               and status in ('potential', 'negotiating', 'booked')
               and pickup_date is not null
               and pickup_date <= current_date + interval '2 days'
             order by pickup_date
             limit 10`,
            [organizationId],
          ),
          query<MissingDocAlert>(
            `select l.id, l.load_number
             from loads l
             where l.organization_id = $1
               and l.status in ('delivered', 'invoiced', 'paid')
               and not exists (
                 select 1 from documents d
                 where d.load_id = l.id and d.document_type = 'pod'
               )
             order by l.created_at desc
             limit 10`,
            [organizationId],
          ),
          query<MissingDocAlert>(
            `select l.id, l.load_number
             from loads l
             where l.organization_id = $1
               and l.status in ('booked', 'dispatched', 'at_pickup', 'loaded', 'in_transit', 'at_delivery')
               and not exists (
                 select 1 from documents d
                 where d.load_id = l.id and d.document_type = 'rate_confirmation'
               )
             order by l.created_at desc
             limit 10`,
            [organizationId],
          ),
        ])
      : [[], [], [], []];

  const alertCount =
    insuranceAlerts.length + pickupAlerts.length + missingPods.length + missingRateConfirmations.length;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <form action={signOut}>
          <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">
            Sign out
          </button>
        </form>
      </div>

      <div className="rounded-md border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
        <p>Signed in as {user.email}</p>
        {organization && appUser ? (
          <p className="text-neutral-500">
            Organization: {organization.name} &middot; Role: {appUser.role}
          </p>
        ) : (
          <p className="text-amber-600 dark:text-amber-400">
            No organization record found for this user yet.
          </p>
        )}
      </div>

      {alertCount > 0 && (
        <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950">
          <p className="font-medium text-amber-900 dark:text-amber-200">
            {alertCount} thing{alertCount === 1 ? "" : "s"} need attention
          </p>

          {insuranceAlerts.length > 0 && (
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">Carrier insurance</p>
              <ul className="ml-4 list-disc text-amber-800 dark:text-amber-300">
                {insuranceAlerts.map((c) => {
                  const days = daysUntil(c.insurance_expiration);
                  return (
                    <li key={c.id}>
                      <Link href="/carriers" className="underline">
                        {c.name}
                      </Link>{" "}
                      {days < 0
                        ? `insurance expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`
                        : days === 0
                          ? "insurance expires today"
                          : `insurance expires in ${days} day${days === 1 ? "" : "s"}`}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {pickupAlerts.length > 0 && (
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">Pickups approaching, not yet booked</p>
              <ul className="ml-4 list-disc text-amber-800 dark:text-amber-300">
                {pickupAlerts.map((l) => {
                  const days = daysUntil(l.pickup_date);
                  return (
                    <li key={l.id}>
                      <Link href={`/loads/${l.id}/edit`} className="underline">
                        {l.load_number}
                      </Link>{" "}
                      ({[l.origin, l.destination].filter(Boolean).join(" → ") || "no lane set"}) —{" "}
                      {days < 0
                        ? `pickup was ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`
                        : days === 0
                          ? "pickup is today"
                          : `pickup in ${days} day${days === 1 ? "" : "s"}`}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {missingPods.length > 0 && (
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">Delivered with no POD on file</p>
              <ul className="ml-4 list-disc text-amber-800 dark:text-amber-300">
                {missingPods.map((l) => (
                  <li key={l.id}>
                    <Link href={`/loads/${l.id}/edit`} className="underline">
                      {l.load_number}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {missingRateConfirmations.length > 0 && (
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">
                Booked/dispatched with no rate confirmation on file
              </p>
              <ul className="ml-4 list-disc text-amber-800 dark:text-amber-300">
                {missingRateConfirmations.map((l) => (
                  <li key={l.id}>
                    <Link href={`/loads/${l.id}/edit`} className="underline">
                      {l.load_number}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <a
          href="/carriers"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Carriers
        </a>
        <a
          href="/drivers"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Drivers
        </a>
        <a
          href="/trucks"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Trucks
        </a>
        <a
          href="/brokers"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Brokers
        </a>
        <a
          href="/loads"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Loads
        </a>
        <a
          href="/matching"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Matching
        </a>
        <a
          href="/dispatch"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Dispatch Board
        </a>
        <a
          href="/financials"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Financials
        </a>
        <a
          href="/documents"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Documents
        </a>
      </div>
    </main>
  );
}
