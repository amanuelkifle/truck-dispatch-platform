import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { replyToSupportConversation, updateSupportConversationStatus } from "@/lib/actions/support";

interface ConversationRow {
  id: string;
  subject: string;
  status: "open" | "waiting" | "resolved";
  updated_at: string;
  organization_name: string;
  member_email: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_role: "member" | "owner";
  body: string;
  created_at: string;
}

const STATUS_STYLES: Record<ConversationRow["status"], string> = {
  open: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  waiting: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
};

export default async function SupportInboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const appUsers = await query<{ role: string }>("select role from users where id = $1", [user.id]);
  const isPlatformAdmin = appUsers[0]?.role === "platform_admin";

  if (!isPlatformAdmin) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-3 px-6 py-24 text-center">
        <p className="text-sm font-medium text-neutral-500">Not authorized</p>
        <p className="text-neutral-600 dark:text-neutral-400">
          The support inbox is only visible to platform admin accounts.
        </p>
        <Link href="/dashboard" className="text-sm underline">
          Back to dashboard
        </Link>
      </main>
    );
  }

  const conversations = await query<ConversationRow>(
    `select sc.id, sc.subject, sc.status, sc.updated_at,
            o.name as organization_name, u.email as member_email
     from support_conversations sc
     join organizations o on o.id = sc.organization_id
     join users u on u.id = sc.user_id
     order by sc.updated_at desc`,
  );

  const messagesByConversation = new Map<string, MessageRow[]>();
  if (conversations.length > 0) {
    const allMessages = await query<MessageRow>(
      `select id, conversation_id, sender_role, body, created_at
       from support_messages
       where conversation_id = any($1::uuid[])
       order by created_at asc`,
      [conversations.map((c) => c.id)],
    );
    for (const message of allMessages) {
      const list = messagesByConversation.get(message.conversation_id) ?? [];
      list.push(message);
      messagesByConversation.set(message.conversation_id, list);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-16">
      <div>
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
          &larr; Dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Support inbox</h1>
        <p className="text-sm text-neutral-500">
          In-app support chat conversations from signed-in accounts.
        </p>
      </div>

      {conversations.length === 0 ? (
        <p className="text-sm text-neutral-500">No conversations yet.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {conversations.map((conversation) => {
            const messages = messagesByConversation.get(conversation.id) ?? [];
            return (
              <div
                key={conversation.id}
                className="rounded-md border border-neutral-200 p-5 dark:border-neutral-800"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {conversation.organization_name}{" "}
                      <span className="font-normal text-neutral-500">
                        &lt;
                        <a href={`mailto:${conversation.member_email}`} className="underline">
                          {conversation.member_email}
                        </a>
                        &gt;
                      </span>
                    </p>
                    <p className="text-sm text-neutral-500">{conversation.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[conversation.status]}`}
                    >
                      {conversation.status}
                    </span>
                    {conversation.status !== "resolved" && (
                      <form
                        action={async () => {
                          "use server";
                          await updateSupportConversationStatus(conversation.id, "resolved");
                        }}
                      >
                        <button type="submit" className="text-xs text-neutral-400 underline hover:text-neutral-700 dark:hover:text-neutral-200">
                          mark resolved
                        </button>
                      </form>
                    )}
                    {conversation.status === "resolved" && (
                      <form
                        action={async () => {
                          "use server";
                          await updateSupportConversationStatus(conversation.id, "open");
                        }}
                      >
                        <button type="submit" className="text-xs text-neutral-400 underline hover:text-neutral-700 dark:hover:text-neutral-200">
                          reopen
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 rounded-md bg-neutral-50 p-3 dark:bg-neutral-900/40">
                  {messages.length === 0 ? (
                    <p className="text-sm text-neutral-500">No messages yet.</p>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="text-sm">
                        <span className="font-medium">
                          {message.sender_role === "owner" ? "You" : conversation.member_email}
                        </span>{" "}
                        <span className="text-xs text-neutral-400">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                        <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                          {message.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <form
                  action={replyToSupportConversation.bind(null, conversation.id)}
                  className="mt-3 flex flex-col gap-2 sm:flex-row"
                >
                  <textarea
                    name="body"
                    placeholder="Reply..."
                    rows={2}
                    className="flex-1 rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
                  >
                    Reply
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
