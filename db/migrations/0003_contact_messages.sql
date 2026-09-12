-- Public "Contact us" form on the marketing homepage (app/page.tsx). Not
-- tied to any organization_id - these come from anonymous visitors who
-- haven't signed up yet, so this is business-level data for the platform
-- owner, not per-tenant data like everything else in this schema.
--
-- Run this once in the Supabase SQL Editor.

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read')),
  created_at timestamptz not null default now()
);
