// Split out from lib/actions/support.ts because a "use server" file can
// only export async functions - exporting a type/interface from one throws
// `Error: A "use server" file can only export async functions, found
// object.` at runtime (same issue hit earlier with documents.ts / see
// lib/document-types.ts).

export interface SupportMessageRow {
  id: string;
  sender_role: "member" | "owner";
  body: string;
  created_at: string;
}

export interface SupportConversationState {
  id: string;
  status: "open" | "waiting" | "resolved";
  subject: string;
  messages: SupportMessageRow[];
}
