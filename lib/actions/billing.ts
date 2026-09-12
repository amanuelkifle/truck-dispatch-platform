"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { getStripe, PLAN_PRICE_IDS } from "@/lib/stripe";

async function requireAppUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rows = await query<{ id: string; organizationId: string; email: string }>(
    'select id, organization_id as "organizationId", email from users where id = $1',
    [user.id],
  );
  const appUser = rows[0];

  if (!appUser) {
    redirect("/login");
  }

  return appUser;
}

// Starts a Stripe Checkout session for the given plan and sends the
// browser there. Reuses this organization's existing Stripe customer if
// one already exists (e.g. a previous trial that lapsed) instead of
// letting repeat attempts pile up duplicate customers in Stripe.
export async function startCheckout(plan: "starter" | "growth") {
  const appUser = await requireAppUser();
  const priceId = PLAN_PRICE_IDS[plan];

  if (!priceId) {
    throw new Error(
      `No Stripe price configured for the "${plan}" plan - set ` +
        `STRIPE_PRICE_${plan.toUpperCase()} in the environment.`,
    );
  }

  const orgRows = await query<{ id: string; stripeCustomerId: string | null }>(
    'select id, stripe_customer_id as "stripeCustomerId" from organizations where id = $1',
    [appUser.organizationId],
  );
  const organization = orgRows[0];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: organization?.stripeCustomerId ?? undefined,
    customer_email: organization?.stripeCustomerId ? undefined : appUser.email,
    client_reference_id: appUser.organizationId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { organizationId: appUser.organizationId },
    },
    metadata: { organizationId: appUser.organizationId, plan },
    success_url: `${appUrl}/dashboard?billing=success`,
    cancel_url: `${appUrl}/subscribe?billing=cancelled`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a Checkout URL.");
  }

  redirect(session.url);
}

// Sends the signed-in org's owner to Stripe's hosted Customer Portal,
// where they can update their card, see past invoices, change plans, or
// cancel - without any billing UI of our own to build or maintain.
export async function openBillingPortal() {
  const appUser = await requireAppUser();

  const orgRows = await query<{ stripeCustomerId: string | null }>(
    'select stripe_customer_id as "stripeCustomerId" from organizations where id = $1',
    [appUser.organizationId],
  );
  const stripeCustomerId = orgRows[0]?.stripeCustomerId;

  if (!stripeCustomerId) {
    // Never checked out yet - nothing for the portal to manage.
    redirect("/subscribe");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripe();

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${appUrl}/dashboard`,
  });

  redirect(portalSession.url);
}
