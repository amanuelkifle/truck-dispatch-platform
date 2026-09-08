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

## Phase 4 — Dispatch Board

- [ ] Truck availability board
- [ ] Active loads
- [ ] Status management
- [ ] Upcoming pickups
- [ ] Upcoming deliveries

## Phase 5 — Financial Analytics

- [ ] Revenue
- [ ] Loaded RPM
- [ ] Effective RPM
- [ ] Deadhead
- [ ] Weekly truck revenue
- [ ] Carrier reporting

## Phase 6 — Documents

- [ ] Rate confirmations
- [ ] BOL
- [ ] POD
- [ ] Carrier packets
- [ ] File storage

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
