import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import SupportChatWidget from "@/components/SupportChatWidget";

export const metadata: Metadata = {
  title: "Truck Dispatch Platform",
  description:
    "Dispatch management for trucking operations of every size, nationwide.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The floating support chat is for signed-in members only - platform_admin
  // accounts reply from /support-inbox instead, and anonymous visitors get
  // the public "Contact us" form on the marketing homepage (app/page.tsx).
  let showSupportChat = false;
  if (user) {
    const rows = await query<{ role: string }>("select role from users where id = $1", [user.id]);
    showSupportChat = rows[0]?.role != null && rows[0].role !== "platform_admin";
  }

  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {showSupportChat && <SupportChatWidget />}
      </body>
    </html>
  );
}
