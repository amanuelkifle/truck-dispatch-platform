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

## Phase 7 — Load Scoring

- [ ] Deadhead scoring
- [ ] RPM scoring
- [ ] Lane scoring
- [ ] Reload scoring
- [ ] Truck/load matching

## Phase 8 — Automation and AI

- [ ] Document extraction
- [ ] AI load recommendations
- [ ] Automated notifications
- [ ] Broker scoring
- [ ] Route recommendations
