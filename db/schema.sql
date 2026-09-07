-- Initial schema for the truck dispatch platform (docs/PROJECT_PLAN.md, section 23).
-- Target: PostgreSQL (Supabase or Neon). Multi-tenant from day one (section 24):
-- every operational table carries organization_id so one customer never sees
-- another customer's data.
--
-- This is a starting point for Phase 1 (Foundation) and Phase 2 (Carrier
-- Operations) — later phases add loads, documents, invoices, etc. as those
-- modules get built.

create extension if not exists "pgcrypto";

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('platform_admin', 'dispatch_company', 'carrier', 'dispatcher')),
  created_at timestamptz not null default now()
);

create table carriers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  mc_number text,
  dot_number text,
  address text,
  phone text,
  email text,
  dispatcher text,
  insurance_expiration date,
  authority_status text,
  equipment_types text[] default '{}',
  preferred_lanes text[] default '{}',
  home_state text,
  notes text,
  status text not null default 'pending' check (status in ('active', 'inactive', 'pending', 'suspended')),
  created_at timestamptz not null default now()
);

create table drivers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  carrier_id uuid references carriers (id) on delete set null,
  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  current_location text,
  home_location text,
  available_date date,
  preferred_lanes text[] default '{}',
  home_time_requirement text,
  hours_available numeric,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table trucks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  carrier_id uuid references carriers (id) on delete set null,
  driver_id uuid references drivers (id) on delete set null,
  truck_number text not null,
  vin text,
  equipment_type text not null check (
    equipment_type in ('dry_van', 'reefer', 'flatbed', 'step_deck', 'power_only', 'box_truck', 'hotshot', 'rgn', 'other')
  ),
  trailer_number text,
  current_city text,
  current_state text,
  available_date date,
  available_time time,
  status text not null default 'available' check (
    status in ('available', 'searching', 'booked', 'at_pickup', 'in_transit', 'at_delivery', 'delivered', 'out_of_service')
  ),
  created_at timestamptz not null default now()
);

create table brokers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  mc_number text,
  dot_number text,
  phone text,
  email text,
  website text,
  payment_terms text,
  credit_rating text,
  average_rate numeric,
  average_days_to_pay numeric,
  loads_completed integer default 0,
  claims integer default 0,
  dispatcher_rating numeric,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table loads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  load_number text not null,
  broker_id uuid references brokers (id) on delete set null,
  carrier_id uuid references carriers (id) on delete set null,
  truck_id uuid references trucks (id) on delete set null,
  driver_id uuid references drivers (id) on delete set null,
  origin text,
  destination text,
  pickup_date date,
  pickup_time time,
  delivery_date date,
  delivery_time time,
  commodity text,
  weight numeric,
  trailer_type text,
  loaded_miles numeric,
  deadhead_miles numeric,
  rate numeric,
  fuel_estimate numeric,
  tolls numeric,
  status text not null default 'potential' check (
    status in (
      'potential', 'negotiating', 'booked', 'dispatched', 'at_pickup',
      'loaded', 'in_transit', 'at_delivery', 'delivered', 'invoiced', 'paid', 'cancelled'
    )
  ),
  notes text,
  created_at timestamptz not null default now()
);

create table load_stops (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  load_id uuid not null references loads (id) on delete cascade,
  stop_type text not null check (stop_type in ('pickup', 'delivery')),
  sequence integer not null,
  location text,
  scheduled_at timestamptz,
  completed_at timestamptz
);

create table dispatch_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  load_id uuid not null references loads (id) on delete cascade,
  truck_id uuid references trucks (id) on delete set null,
  driver_id uuid references drivers (id) on delete set null,
  assigned_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  document_type text not null,
  carrier_id uuid references carriers (id) on delete set null,
  driver_id uuid references drivers (id) on delete set null,
  truck_id uuid references trucks (id) on delete set null,
  load_id uuid references loads (id) on delete set null,
  broker_id uuid references brokers (id) on delete set null,
  storage_key text not null,
  uploaded_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  load_id uuid references loads (id) on delete set null,
  amount numeric not null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  invoice_id uuid references invoices (id) on delete set null,
  amount numeric not null,
  paid_at timestamptz
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  truck_id uuid references trucks (id) on delete set null,
  category text not null,
  amount numeric not null,
  incurred_at date not null default current_date
);

create table load_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  load_id uuid not null references loads (id) on delete cascade,
  score numeric not null,
  computed_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid references users (id) on delete cascade,
  event_type text not null,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid references users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index on carriers (organization_id);
create index on drivers (organization_id);
create index on trucks (organization_id);
create index on brokers (organization_id);
create index on loads (organization_id);
create index on documents (organization_id);
