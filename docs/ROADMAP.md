# Roadmap

Phase breakdown from `docs/PROJECT_PLAN.md` (section 29), tracked here as a
checklist. Check items off as they land.

## Phase 1 — Foundation (done)

- [x] GitHub repository
- [x] Next.js application (TypeScript + Tailwind)
- [x] Vercel deployment
- [x] PostgreSQL database (Supabase or Neon)
- [x] Authentication (Supabase Auth)
- [x] Organization model
- [x] User roles (basic - richer per-role permissions come later)

## Phase 2 — Carrier Operations (done, trailers deferred)

- [x] Carrier management
- [x] Driver management
- [x] Truck management
- [ ] Trailer management (deferred — trucks carry a free-text
      trailer_number for now; revisit if a dedicated trailers entity is
      ever needed)

## Phase 3 — Loads (done)

- [x] Create load
- [x] Edit load
- [x] Assign truck
- [x] Assign driver
- [x] Load status
- [x] Pickup and delivery workflow (status progression through
      potential -> ... -> delivered -> invoiced -> paid on the loads list)

Note: added minimal Broker management (list + create, no edit form yet)
as supporting infrastructure, since a load links to a broker.

## Phase 4 — Dispatch Board (done)

- [x] Truck availability board (kanban by truck status, all 8 TruckStatus
      values as columns rather than the plan's suggested 6, so
      at_delivery / out_of_service aren't hidden from dispatch)
- [x] Active loads (shown on each truck's card, plus a total count)
- [x] Status management (inline status update per card, same pattern as
      /trucks)
- [x] Upcoming pickups
- [x] Upcoming deliveries

## Phase 5 — Financial Analytics (done)

- [x] Revenue (org-wide gross revenue, recognized on delivered / invoiced / paid)
- [x] Loaded RPM (org-wide and per-truck average)
- [x] Effective RPM (org-wide, per-truck, and per-carrier average)
- [x] Deadhead (miles and deadhead % at org and carrier level)
- [x] Weekly truck revenue
- [x] Carrier reporting (weekly/monthly gross, avg RPM, revenue per truck,
      deadhead %, loads per truck)

Note: dispatch-company fee models (section 17 - percentage / flat / hybrid)
are a separate SaaS-billing concern, not built here.

## Phase 6 — Documents (done)

- [x] Rate confirmations (document_type on upload)
- [x] BOL (document_type on upload)
- [x] POD (document_type on upload)
- [x] Carrier packets (document_type on upload)
- [x] File storage (Supabase Storage, private bucket, service-role-only
      access - browser never talks to Storage directly, same trust model
      as Postgres access in lib/db.ts)

One-time setup required before this works: create a PRIVATE bucket named
"documents" in Supabase dashboard -> Storage, and run
db/migrations/0001_documents_metadata.sql in the SQL Editor.

## Phase 7 — Load Scoring (done, market-data-dependent factors deferred)

- [x] Deadhead scoring (straight-line/manual estimate on the Loads list;
      real Mapbox driving distance on the dedicated matching view)
- [x] RPM scoring (net rate/mile after fuel + tolls, $1.50-$4.00/mi band)
- [x] Lane scoring (match against carrier preferred_lanes)
- [x] Reload scoring (proxy: count of the org's other open loads whose
      origin is within 75mi of this load's destination - a stand-in for
      true market reload probability, computed from this app's own
      pipeline rather than a live load-board feed)
- [x] Truck/load matching (`/matching` - pick an available/searching
      truck, rank unassigned loads by score using a real driving-distance
      deadhead from that truck's current location)
- [x] Mapbox integration (geocoding on truck/load create+edit; Directions
      Matrix for the matching view; free tier - 100k requests/month -
      verified sufficient for realistic usage, batched 1 truck x N loads
      per request)
- [x] Broker risk factor (broker.status folded into the composite score)

Note: per docs/PROJECT_PLAN.md section 12, "Destination Market Strength"
and true reload probability (from a live load-board feed) and HOS/detention
risk (from ELD integration) are explicitly deferred - this app has no data
source for any of those yet. The reload and broker-status factors above are
the closest achievable stand-ins with data already in the schema.

## Phase 8 — Automation and AI (in-app notifications done, AI deferred)

- [x] Automated notifications (in-app only, computed fresh on every
      dashboard load - no email/SMS provider, no cron: carrier insurance
      expiring/expired, pickups approaching or overdue on
      not-yet-booked loads, delivered loads with no POD on file,
      booked/dispatched loads with no rate confirmation on file)
- [ ] Document extraction (deferred - needs an AI/OCR provider, on hold
      per cost/scope discussion)
- [ ] AI load recommendations (deferred - same reason; Phase 7's scoring
      above is a plain weighted formula, not AI-based)
- [ ] Broker scoring beyond the status flag already folded into Phase 7
- [ ] Route recommendations
