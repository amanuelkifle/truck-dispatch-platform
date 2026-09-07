# Truck Dispatch Platform

A modern web-based truck dispatch and logistics platform for dispatchers,
carriers, owner-operators, and (eventually) freight brokers.

This is a **standalone project**, fully independent from any other project —
its own repository, database, authentication, environment variables, and
Vercel project. See `docs/PROJECT_PLAN.md` for the full product plan.

## Stack

- [Next.js](https://nextjs.org/) (App Router) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- PostgreSQL (Supabase or Neon — not yet provisioned)
- Deployed on [Vercel](https://vercel.com/)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # vitest
npm run build        # production build
```

## Project structure

```text
app/          Next.js App Router pages, layouts, and routes
components/   Shared React components
lib/          Domain types, calculations, and shared utilities
db/           Database schema (schema.sql) and migrations
services/     Server-side business logic / integrations
workers/      Background job handlers (document processing, notifications, AI)
public/       Static assets
tests/        Automated tests
docs/         Project plan and roadmap
```

## Documentation

- [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) — the full product plan:
  modules, data model, MVP phases, architecture, and success criteria.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — phase-by-phase build checklist.

## Deployment

- **`main`** → Vercel Production
- **`develop`** → Vercel Staging
- Feature branches (`feature/*`, `fix/*`) → Vercel Preview deployments via PR

## Environment variables

Set these in the Vercel project (Project Settings → Environment Variables),
never in source control. See `.env.example` for the full list.
