import Stripe from "stripe";

// Single shared Stripe client, created lazily (same pattern as lib/db.ts's
// connection pool) so pages that merely import this module during the
// Next.js build don't fail just because STRIPE_SECRET_KEY isn't set in
// that context.
//
// apiVersion is pinned to a specific dated version on purpose - Stripe
// guarantees a pinned version keeps working indefinitely, so upgrading is
// always a deliberate, tested choice (Stripe dashboard -> Developers ->
// API version) rather than something that silently changes shape under
// this code. Note for future changes: as of the "Basil" version
// (2025-03-31), `current_period_end` moved off the Subscription object
// onto each SubscriptionItem - see the webhook handler for where that's
// read from.
declare global {
  // eslint-disable-next-line no-var
  var _stripeClient: Stripe | undefined;
}

export function getStripe(): Stripe {
  if (global._stripeClient) {
    return global._stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local (test mode key from " +
        "the Stripe dashboard under Developers -> API keys), or on Vercel " +
        "under Project Settings -> Environment Variables.",
    );
  }

  global._stripeClient = new Stripe(secretKey, {
    apiVersion: "2025-08-27.basil",
  });
  return global._stripeClient;
}

// Maps our internal plan tiers to the Stripe Price IDs created in the
// Stripe dashboard (Product catalog -> each plan -> its recurring monthly
// Price). Enterprise has no self-serve price - it stays "Contact us" on
// the pricing page, a manual/sales conversation rather than a Checkout
// flow, so it's intentionally left out here.
export const PLAN_PRICE_IDS: Record<"starter" | "growth", string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
};
