"use client";

// Floating support chat, mirroring the one already running on StockIQ:
// a launcher button in the bottom-right corner, a panel with the signed-in
// user's conversation history, and a compose box. Mounted once in
// app/layout.tsx, only for signed-in non-platform_admin users (platform
// admins reply from /support-inbox instead - see docs there).
//
// Unlike StockIQ's vanilla-JS version (which talks to a Vercel serverless
// function over fetch), this calls the "use server" actions in
// lib/actions/support.ts directly - Next.js transports that as a request
// under the hood, so there's no separate API route to maintain.

import { useEffect, useRef, useState, useTransition } from "react";
import { fetchMySupportConversation, sendSupportMessage } from "@/lib/actions/support";
import type { SupportConversationState } from "@/lib/support-types";

const STATUS_LABEL: Record<SupportConversationState["status"], string> = {
  open: "Open",
  waiting: "Waiting on us",
  resolved: "Resolved",
};

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<SupportConversationState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Reload every time the panel opens (not just once ever) so a reply the
  // owner sent while it was closed shows up - matches the StockIQ version,
  // which does the same on each toggle-open rather than caching forever.
  useEffect(() => {
    if (!open) return;
    setLoaded(false);
    fetchMySupportConversation()
      .then((state) => setConversation(state))
      .catch(() => setError("Couldn't load your conversation. Try again in a moment."))
      .finally(() => setLoaded(true));
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [conversation?.messages.length]);

  function handleSend() {
    const body = input.trim();
    if (!body || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        const updated = await sendSupportMessage(body);
        setConversation(updated);
        setInput("");
      } catch {
        setError("Message didn't send. Try again.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-lg dark:bg-white dark:text-neutral-900"
      >
        {open ? "Close" : "Support chat"}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[520px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <div>
              <p className="text-sm font-semibold">Support</p>
              <p className="text-xs text-neutral-500">
                {conversation ? STATUS_LABEL[conversation.status] : "Ready"}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-neutral-50 px-4 py-3 dark:bg-neutral-900/40">
            {!loaded ? (
              <p className="text-sm text-neutral-500">Loading&hellip;</p>
            ) : !conversation || conversation.messages.length === 0 ? (
              <p className="text-sm text-neutral-500">
                How can we help? Send a message below and we&rsquo;ll get back to you here.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {conversation.messages.map((m) => (
                  <div
                    key={m.id}
                    className={m.sender_role === "owner" ? "flex justify-start" : "flex justify-end"}
                  >
                    <div
                      className={
                        m.sender_role === "owner"
                          ? "max-w-[80%] rounded-lg bg-white px-3 py-2 text-sm shadow-sm dark:bg-neutral-800"
                          : "max-w-[80%] rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
                      }
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p
                        className={
                          m.sender_role === "owner"
                            ? "mt-1 text-[10px] text-neutral-400"
                            : "mt-1 text-[10px] text-neutral-300 dark:text-neutral-600"
                        }
                      >
                        {m.sender_role === "owner" ? "Support" : "You"} &middot;{" "}
                        {new Date(m.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
            {error && <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              rows={2}
              className="w-full resize-none rounded-md border border-neutral-300 bg-transparent px-2.5 py-2 text-sm dark:border-neutral-700"
            />
            <button
              onClick={handleSend}
              disabled={isPending || !input.trim()}
              className="mt-2 w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
            >
              {isPending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
