-- Stripe billing fields for organizations. One subscription per
-- organization. Stripe is the source of truth for billing state; these
-- columns are a cache the app reads on every page load, kept in sync by
-- the webhook handler at app/api/stripe/webhook/route.ts.

alter table organizations
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column plan text check (plan in ('starter', 'growth', 'enterprise')),
  add column subscription_status text
    check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  add column trial_ends_at timestamptz,
  add column current_period_end timestamptz;

create index on organizations (stripe_customer_id);
create index on organizations (stripe_subscription_id);
