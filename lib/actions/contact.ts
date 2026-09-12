"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { sendContactNotificationEmail } from "@/lib/resend";

async function requirePlatformAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rows = await query<{ role: string }>(
    "select role from users where id = $1",
    [user.id],
  );

  if (rows[0]?.role !== "platform_admin") {
    throw new Error("Platform admin access required.");
  }
}

// Public form - no auth, no organization_id. Anyone visiting the marketing
// homepage can submit this before ever creating an account.
export async function submitContactMessage(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    redirect("/?contact=error#contact");
  }

  await query(
    "insert into contact_messages (name, email, company, message) values ($1, $2, $3, $4)",
    [name, email, company, message],
  );

  // Best-effort - the message above is already saved regardless of whether
  // this succeeds, fails, or isn't configured at all (see lib/resend.ts).
  await sendContactNotificationEmail({ name, email, company, message });

  redirect("/?contact=sent#contact");
}

export async function markContactMessageStatus(messageId: string, status: "new" | "read") {
  await requirePlatformAdmin();

  await query("update contact_messages set status = $1 where id = $2", [status, messageId]);

  revalidatePath("/contact-messages");
}
