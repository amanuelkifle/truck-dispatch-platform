// Best-effort transactional email via Resend (https://resend.com), used to
// notify the platform owner when someone submits the public "Contact us"
// form (lib/actions/contact.ts) or sends a message in the in-app support
// chat (lib/actions/support.ts). Never blocks either flow - if
// RESEND_API_KEY isn't configured, or the API call fails for any reason,
// the message is still saved to the database and just won't trigger an
// email.
//
// Sends from Resend's shared "onboarding@resend.dev" testing address by
// default, which works with zero setup as long as the recipient
// (CONTACT_NOTIFICATION_EMAIL) is the same email the Resend account itself
// was signed up with - Resend restricts that shared address to sending only
// to the account owner's own email until a custom domain is verified. Set
// CONTACT_FROM_EMAIL once you verify a domain in the Resend dashboard if you
// want a branded "from" address or to notify a different inbox.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_NOTIFICATION_EMAIL = process.env.CONTACT_NOTIFICATION_EMAIL;
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

async function sendPlatformNotificationEmail(options: {
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<void> {
  if (!RESEND_API_KEY || !CONTACT_NOTIFICATION_EMAIL) {
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Truck Dispatch Platform <${CONTACT_FROM_EMAIL}>`,
        to: [CONTACT_NOTIFICATION_EMAIL],
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
        subject: options.subject,
        text: options.text,
      }),
    });
  } catch {
    // Best-effort - the underlying message is already saved either way.
  }
}

export async function sendContactNotificationEmail(submission: {
  name: string;
  email: string;
  company: string | null;
  message: string;
}): Promise<void> {
  await sendPlatformNotificationEmail({
    subject: `New contact message from ${submission.name}`,
    replyTo: submission.email,
    text:
      `Name: ${submission.name}\n` +
      `Email: ${submission.email}\n` +
      `Company: ${submission.company || "(not provided)"}\n\n` +
      `${submission.message}\n\n` +
      `-- Reply directly to this email to respond, or check /contact-messages in the app.`,
  });
}

export async function sendSupportNotificationEmail(submission: {
  memberEmail: string;
  organizationName: string;
  body: string;
}): Promise<void> {
  await sendPlatformNotificationEmail({
    subject: `New support chat message from ${submission.organizationName}`,
    replyTo: submission.memberEmail,
    text:
      `From: ${submission.memberEmail} (${submission.organizationName})\n\n` +
      `${submission.body}\n\n` +
      `-- Reply from /support-inbox in the app (replying to this email won't reach them there).`,
  });
}
