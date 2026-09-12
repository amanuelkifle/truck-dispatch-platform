import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import BillingFlowClient from "@/components/BillingFlowClient";
import type { Organization } from "@/lib/types";

// Platform-admin-only view of the Stripe billing lifecycle, wired to real
// data: each stage shows the actual organizations currently in it (not just
// a static diagram). Same auth-gating pattern as app/contact-messages and
// app/support-inbox.
export default async function BillingFlowPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const appUsers = await query<{ role: string }>(
    "select role from users where id = $1",
    [user.id],
  );
  const isPlatformAdmin = appUsers[0]?.role === "platform_admin";

  if (!isPlatformAdmin) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-3 px-6 py-24 text-center">
        <p className="text-sm font-medium text-neutral-500">Not authorized</p>
        <p className="text-neutral-600 dark:text-neutral-400">
          The billing flow view is only visible to platform admin accounts.
        </p>
        <Link href="/dashboard" className="text-sm underline">
          Back to dashboard
        </Link>
      </main>
    );
  }

  const organizations = await query<Organization>(
    `select id, name, created_at as "createdAt", plan,
            subscription_status as "subscriptionStatus",
            trial_ends_at as "trialEndsAt", current_period_end as "currentPeriodEnd"
     from organizations
     order by created_at desc`,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
      <div>
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
          &larr; Dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Billing flow</h1>
        <p className="text-sm text-neutral-500">
          Click a stage to see which organizations are actually in it right now &mdash; pulled live
          from the database, not a static diagram.
        </p>
      </div>

      <BillingFlowClient organizations={organizations} />
    </main>
  );
}
