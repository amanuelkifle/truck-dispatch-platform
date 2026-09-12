import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { query } from "@/lib/db";

// The single place that keeps organizations' billing columns in sync with
// what Stripe actually thinks is true. Register this URL
// (https://<your-domain>/api/stripe/webhook) under Stripe dashboard ->
// Developers -> Webhooks, subscribed to the event types handled below,
// then copy its signing secret into STRIPE_WEBHOOK_SECRET.
//
// Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
// (Stripe CLI) prints a temporary signing secret to put in .env.local.

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      // Fires once, right after the customer finishes Checkout. This is
      // where we learn the Stripe customer id for the first time and tie
      // it back to our organization via client_reference_id/metadata (set
      // in lib/actions/billing.ts's startCheckout).
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.client_reference_id ?? session.metadata?.organizationId;
        const plan = session.metadata?.plan;

        if (organizationId && typeof session.customer === "string") {
          await query(
            `update organizations
             set stripe_customer_id = $1,
                 stripe_subscription_id = coalesce($2, stripe_subscription_id),
                 plan = coalesce($3, plan)
             where id = $4`,
            [
              session.customer,
              typeof session.subscription === "string" ? session.subscription : null,
              plan ?? null,
              organizationId,
            ],
          );
        }
        break;
      }

      // Fires on creation and on every status change (trial ending,
      // renewal, plan change, dunning retries, cancellation scheduled...).
      // This is the main source of truth for subscription_status.
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organizationId;

        // As of the Stripe "Basil" API version, current_period_end lives
        // on each subscription item rather than on the subscription
        // itself - see lib/stripe.ts. We only ever create single-price
        // subscriptions, so the first item is the one that matters.
        const item = subscription.items.data[0];
        const periodEnd = item ? new Date(item.current_period_end * 1000).toISOString() : null;
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;

        if (organizationId) {
          await query(
            `update organizations
             set stripe_subscription_id = $1,
                 subscription_status = $2,
                 current_period_end = $3,
                 trial_ends_at = $4
             where id = $5`,
            [subscription.id, subscription.status, periodEnd, trialEnd, organizationId],
          );
        } else if (typeof subscription.customer === "string") {
          // Fallback for events where metadata didn't carry through -
          // match on the Stripe customer id instead (set during checkout).
          await query(
            `update organizations
             set stripe_subscription_id = $1,
                 subscription_status = $2,
                 current_period_end = $3,
                 trial_ends_at = $4
             where stripe_customer_id = $5`,
            [subscription.id, subscription.status, periodEnd, trialEnd, subscription.customer],
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await query(
          `update organizations set subscription_status = 'canceled' where stripe_subscription_id = $1`,
          [subscription.id],
        );
        break;
      }

      // A recurring charge failed. Stripe will keep retrying it
      // automatically on its own schedule (Smart Retries) - we just
      // reflect the "at risk" state so the dashboard can warn the org.
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof invoice.parent?.subscription_details?.subscription === "string"
            ? invoice.parent.subscription_details.subscription
            : null;
        if (subscriptionId) {
          await query(
            `update organizations set subscription_status = 'past_due' where stripe_subscription_id = $1`,
            [subscriptionId],
          );
        }
        break;
      }

      // A retried (or on-time) charge succeeded after being past_due -
      // customer.subscription.updated already covers the normal renewal
      // case, this just clears a past_due flag promptly.
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof invoice.parent?.subscription_details?.subscription === "string"
            ? invoice.parent.subscription_details.subscription
            : null;
        if (subscriptionId) {
          await query(
            `update organizations
             set subscription_status = 'active'
             where stripe_subscription_id = $1 and subscription_status = 'past_due'`,
            [subscriptionId],
          );
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
