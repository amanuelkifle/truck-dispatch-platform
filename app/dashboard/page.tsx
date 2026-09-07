import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { signOut } from "@/lib/actions/auth";
import type { AppUser, Organization } from "@/lib/types";

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

      <p className="text-sm text-neutral-500">
        Carrier/driver/truck management, the dispatch board, and the load
        profitability engine (Phases 2-5 in docs/ROADMAP.md) get built here.
      </p>
    </main>
  );
}
