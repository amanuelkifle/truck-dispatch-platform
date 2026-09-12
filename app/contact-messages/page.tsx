import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { markContactMessageStatus } from "@/lib/actions/contact";

interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  status: "new" | "read";
  created_at: string;
}

export default async function ContactMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const appUsers = await query<{ role: string }>(
    "select role from users where id = $1",
    [user.id],
  );
  const isPlatformAdmin = appUsers[0]?.role === "platform_admin";

  if (!isPlatformAdmin) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-3 px-6 py-24 text-center">
        <p className="text-sm font-medium text-neutral-500">Not authorized</p>
        <p className="text-neutral-600 dark:text-neutral-400">
          Contact messages are only visible to platform admin accounts.
        </p>
        <Link href="/dashboard" className="text-sm underline">
          Back to dashboard
        </Link>
      </main>
    );
  }

  const messages = await query<ContactMessageRow>(
    "select id, name, email, company, message, status, created_at from contact_messages order by created_at desc",
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-16">
      <div>
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
          &larr; Dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Contact messages</h1>
        <p className="text-sm text-neutral-500">
          Submissions from the public &ldquo;Contact us&rdquo; form on the marketing homepage.
        </p>
      </div>

      {messages.length === 0 ? (
        <p className="text-sm text-neutral-500">No messages yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.status === "new"
                  ? "rounded-md border-2 border-amber-300 p-5 dark:border-amber-800"
                  : "rounded-md border border-neutral-200 p-5 dark:border-neutral-800"
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {m.name}{" "}
                    <span className="font-normal text-neutral-500">
                      &lt;
                      <a href={`mailto:${m.email}`} className="underline">
                        {m.email}
                      </a>
                      &gt;
                    </span>
                  </p>
                  {m.company && <p className="text-sm text-neutral-500">{m.company}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await markContactMessageStatus(m.id, m.status === "new" ? "read" : "new");
                    }}
                  >
                    <button
                      type="submit"
                      className={
                        m.status === "new"
                          ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                      }
                    >
                      {m.status === "new" ? "mark read" : "mark unread"}
                    </button>
                  </form>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                {m.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
