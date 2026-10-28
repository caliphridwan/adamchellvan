import "server-only";

// Transactional email via Resend's REST API (https://resend.com). No SDK dependency.
// If RESEND_API_KEY is not set, emails are skipped and a non-PII notice is logged.

type SendArgs = {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail({ to, subject, text, replyTo }: SendArgs): Promise<{ sent: boolean }> {
  if (!isEmailConfigured()) {
    console.info(`[email] skipped (provider not configured): "${subject}"`);
    return { sent: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[email] provider responded ${res.status} for "${subject}"`);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error(`[email] send failed for "${subject}":`, (err as Error).message);
    return { sent: false };
  }
}

/** Where staff notifications go: NOTIFY_EMAIL env, falling back to the company email in settings. */
export function staffRecipients(settingsEmail?: string | null): string[] {
  const fromEnv = (process.env.NOTIFY_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromEnv.length) return fromEnv;
  return settingsEmail ? [settingsEmail] : [];
}
