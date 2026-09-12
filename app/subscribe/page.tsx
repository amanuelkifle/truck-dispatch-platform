import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { startCheckout } from "@/lib/actions/billing";
import type { Organization } from "@/lib/types";

const PLANS = [
  {
    id: "starter" as const,
    name: "Starter",
    price: "$49",
    blurb: "For a single dispatch operation getting off the ground.",
    features: ["Up to 5 trucks", "Unlimited loads", "Dispatch board & documents"],
  },
  {
    id: "growth" as const,
    name: "Growth",
    price: "$129",
    blurb: "For growing fleets running multiple trucks a week.",
    features: [
      "Up to 25 trucks",
      "Everything in Starter",
      "Financial analytics",
      "Priority support",
    ],
  },
];

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: { billing?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userRows = await query<{ organizationId: string }>(
    'select organization_id as "organizationId" from users where id = $1',
    [user.id],
  );

  if (!userRows[0]) {
    redirect("/login");
  }

  const orgRows = await query<Organization>(
    `select id, name, created_at as "createdAt", plan,
            subscription_status as "subscriptionStatus",
            trial_ends_at as "trialEndsAt", current_period_end as "currentPeriodEnd"
     from organizations where id = $1`,
    [userRows[0].organizationId],
  );
  const organization = orgRows[0];

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-16">
      <div>
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
          &larr; Dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Choose a plan</h1>
        <p className="text-sm text-neutral-500">
          14-day free trial, cancel anytime. A card is required up front so your access
          continues automatically when the trial ends.
        </p>
      </div>

      {searchParams.billing === "cancelled" && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Checkout was cancelled — no charge was made. Pick a plan below whenever you&rsquo;re
          ready.
        </p>
      )}

      {organization?.subscriptionStatus && (
        <p className="rounded-md border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
          Current plan: <span className="font-medium">{organization.plan}</span> &middot;
          Status: <span className="font-medium">{organization.subscriptionStatus}</span>
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800"
          >
            <div>
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="text-sm text-neutral-500">{plan.blurb}</p>
            </div>
            <p className="text-3xl font-semibold">
              {plan.price}
              <span className="text-sm font-normal text-neutral-500"> /mo</span>
            </p>
            <ul className="flex flex-col gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              {plan.features.map((feature) => (
                <li key={feature}>&#10003; {feature}</li>
              ))}
            </ul>
            <form action={startCheckout.bind(null, plan.id)}>
              <button
                type="submit"
                className="mt-2 w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
              >
                Start 14-day trial
              </button>
            </form>
          </div>
        ))}
      </div>

      <p className="text-sm text-neutral-500">
        Need more than 25 trucks, or a custom setup?{" "}
        <a href="/#contact" className="underline">
          Contact us
        </a>{" "}
        about Enterprise pricing.
      </p>
    </main>
  );
}
