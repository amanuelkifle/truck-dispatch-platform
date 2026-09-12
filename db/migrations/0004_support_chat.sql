-- In-app support chat for signed-in users, mirroring what's already running
-- on StockIQ (same idea: a conversation + messages table, an email nudge to
-- the platform owner on each new member message). Unlike the public
-- Contact-us form (contact_messages), this is for people who already have
-- an account - a floating chat button/panel shown across the app once
-- signed in (see components/SupportChatWidget.tsx), replied to by
-- platform_admin accounts from /support-inbox.
--
-- Run this once in the Supabase SQL Editor.

create table support_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  subject text not null default 'Support request',
  status text not null default 'open' check (status in ('open', 'waiting', 'resolved')),
  last_sender_role text not null default 'member' check (last_sender_role in ('member', 'owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references support_conversations (id) on delete cascade,
  sender_user_id uuid not null references users (id) on delete cascade,
  sender_role text not null check (sender_role in ('member', 'owner')),
  body text not null,
  created_at timestamptz not null default now()
);
