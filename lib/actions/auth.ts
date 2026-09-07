"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";

// Sign up: creates the Supabase auth user, then an Organization + a row in
// our own `users` table (keyed by the auth user's id) so the rest of the
// app has an organization_id and role to work with (section 24).
export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const organizationName =
    String(formData.get("organizationName") ?? "").trim() ||
    `${email.split("@")[0]}'s organization`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.user) {
    // Email confirmation is required and no session/user is available yet.
    redirect("/login?error=Check your email to confirm your account, then sign in.");
  }

  const orgRows = await query<{ id: string }>(
    "insert into organizations (name) values ($1) returning id",
    [organizationName],
  );
  const organizationId = orgRows[0].id;

  await query(
    "insert into users (id, organization_id, email, role) values ($1, $2, $3, $4)",
    [data.user.id, organizationId, email, "dispatch_company"],
  );

  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
