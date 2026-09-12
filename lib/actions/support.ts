"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { sendSupportNotificationEmail } from "@/lib/resend";
import type { SupportMessageRow, SupportConversationState } from "@/lib/support-types";

interface AuthedUser {
  id: string;
  organizationId: string;
  email: string;
  role: string;
}

async function requireAppUser(): Promise<AuthedUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rows = await query<{ organization_id: string; email: string; role: string }>(
    "select organization_id, email, role from users where id = $1",
    [user.id],
  );

  if (rows.length === 0) {
    throw new Error("No organization is linked to this account yet. Sign out and sign back in, or contact support.");
  }

  return { id: user.id, organizationId: rows[0].organization_id, email: rows[0].email, role: rows[0].role };
}

async function requirePlatformAdmin(): Promise<AuthedUser> {
  const appUser = await requireAppUser();
  if (appUser.role !== "platform_admin") {
    throw new Error("Platform admin access required.");
  }
  return appUser;
}

// Called by the floating chat widget (components/SupportChatWidget.tsx) on
// open, to load the signed-in member's current conversation, if any.
export async function fetchMySupportConversation(): Promise<SupportConversationState | null> {
  const appUser = await requireAppUser();

  const conversations = await query<{ id: string; status: "open" | "waiting" | "resolved"; subject: string }>(
    `select id, status, subject from support_conversations
     where user_id = $1
     order by updated_at desc
     limit 1`,
    [appUser.id],
  );
  const conversation = conversations[0];
  if (!conversation) return null;

  const messages = await query<SupportMessageRow>(
    `select id, sender_role, body, created_at from support_messages
     where conversation_id = $1
     order by created_at asc`,
    [conversation.id],
  );

  return { ...conversation, messages };
}

// Called by the widget when the member sends a message. Reuses the most
// recent conversation unless it's already resolved, in which case a fresh
// one starts - same behavior as the StockIQ version this mirrors.
export async function sendSupportMessage(body: string): Promise<SupportConversationState> {
  const appUser = await requireAppUser();
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Write a message first.");
  }

  const existing = await query<{ id: string; status: "open" | "waiting" | "resolved" }>(
    `select id, status from support_conversations
     where user_id = $1
     order by updated_at desc
     limit 1`,
    [appUser.id],
  );

  let conversationId: string;
  if (existing[0] && existing[0].status !== "resolved") {
    conversationId = existing[0].id;
  } else {
    const orgRows = await query<{ name: string }>("select name from organizations where id = $1", [
      appUser.organizationId,
    ]);
    const created = await query<{ id: string }>(
      `insert into support_conversations (organization_id, user_id, subject)
       values ($1, $2, $3) returning id`,
      [appUser.organizationId, appUser.id, `Support request - ${orgRows[0]?.name ?? "New conversation"}`],
    );
    conversationId = created[0].id;
  }

  await query(
    `insert into support_messages (conversation_id, sender_user_id, sender_role, body)
     values ($1, $2, 'member', $3)`,
    [conversationId, appUser.id, trimmed],
  );

  await query(
    `update support_conversations set status = 'open', last_sender_role = 'member', updated_at = now()
     where id = $1`,
    [conversationId],
  );

  const orgRows = await query<{ name: string }>("select name from organizations where id = $1", [
    appUser.organizationId,
  ]);
  await sendSupportNotificationEmail({
    memberEmail: appUser.email,
    organizationName: orgRows[0]?.name ?? "Unknown organization",
    body: trimmed,
  });

  revalidatePath("/support-inbox");

  const messages = await query<SupportMessageRow>(
    `select id, sender_role, body, created_at from support_messages
     where conversation_id = $1
     order by created_at asc`,
    [conversationId],
  );
  const conversationRows = await query<{ status: "open" | "waiting" | "resolved"; subject: string }>(
    "select status, subject from support_conversations where id = $1",
    [conversationId],
  );

  return { id: conversationId, status: conversationRows[0].status, subject: conversationRows[0].subject, messages };
}

// Platform-admin-only: reply to a member's conversation from /support-inbox.
export async function replyToSupportConversation(conversationId: string, formData: FormData) {
  const appUser = await requirePlatformAdmin();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await query(
    `insert into support_messages (conversation_id, sender_user_id, sender_role, body)
     values ($1, $2, 'owner', $3)`,
    [conversationId, appUser.id, body],
  );

  await query(
    `update support_conversations set status = 'waiting', last_sender_role = 'owner', updated_at = now()
     where id = $1`,
    [conversationId],
  );

  revalidatePath("/support-inbox");
}

export async function updateSupportConversationStatus(
  conversationId: string,
  status: "open" | "waiting" | "resolved",
) {
  await requirePlatformAdmin();

  await query("update support_conversations set status = $1, updated_at = now() where id = $2", [
    status,
    conversationId,
  ]);

  revalidatePath("/support-inbox");
}
