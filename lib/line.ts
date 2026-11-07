import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// LINE Messaging API. Everything here is optional: without LINE_CHANNEL_ACCESS_TOKEN,
// LINE_CHANNEL_SECRET and SUPABASE_SECRET_KEY the app keeps working with in-app
// notifications only.

export function lineConfig() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const secret = process.env.LINE_CHANNEL_SECRET;
  const botId = process.env.LINE_BOT_BASIC_ID; // e.g. "@dormdee", for the add-friend link
  if (!token || !secret || !process.env.SUPABASE_SECRET_KEY) return null;
  return { token, secret, botId: botId ?? null };
}

/** Checks the X-Line-Signature header against the raw request body. */
export function verifyLineSignature(body: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  const given = Buffer.from(signature, "base64");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function callLine(path: string, token: string, payload: unknown) {
  const response = await fetch(`https://api.line.me/v2/bot/message/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return response.ok;
}

export function replyLine(replyToken: string, text: string, token: string) {
  return callLine("reply", token, { replyToken, messages: [{ type: "text", text }] });
}

/**
 * Pushes in-app notifications from the last few minutes that have not gone to LINE
 * yet, for every user who linked a LINE account. Call it with `after()` once an
 * action has created notifications; it never throws.
 */
export async function flushLineNotifications() {
  const config = lineConfig();
  const admin = createAdminClient();
  if (!config || !admin) return;
  try {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: links } = await admin.from("line_links").select("user_id, line_user_id").not("line_user_id", "is", null);
    if (!links?.length) return;
    const lineIdOf = new Map(links.map((l) => [l.user_id, l.line_user_id as string]));

    const { data: pending } = await admin
      .from("notifications")
      .select("id, user_id, title, body, link")
      .is("line_sent_at", null)
      .gte("created_at", since)
      .in("user_id", [...lineIdOf.keys()])
      .order("created_at")
      .limit(50);
    if (!pending?.length) return;

    // Claim first so two overlapping flushes do not send the same message twice.
    const { data: claimed } = await admin
      .from("notifications")
      .update({ line_sent_at: new Date().toISOString() })
      .in("id", pending.map((n) => n.id))
      .is("line_sent_at", null)
      .select("id");
    const mine = new Set((claimed ?? []).map((c) => c.id));

    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    await Promise.all(
      pending
        .filter((n) => mine.has(n.id))
        .map((n) => {
          const text = [n.title, n.body, n.link ? `${site}${n.link}` : null].filter(Boolean).join("\n").slice(0, 4900);
          return callLine("push", config.token, { to: lineIdOf.get(n.user_id), messages: [{ type: "text", text }] });
        }),
    );
  } catch (error) {
    console.error("LINE push failed", error);
  }
}
