import { NextResponse, type NextRequest } from "next/server";
import { lineConfig, replyLine, verifyLineSignature } from "@/lib/line";
import { createAdminClient } from "@/lib/supabase/admin";

interface LineEvent {
  type: string;
  replyToken?: string;
  source?: { userId?: string };
  message?: { type: string; text?: string };
}

/**
 * LINE webhook. A user links their account by sending the 6-character code from
 * the DormDee account page to the bot.
 */
export async function POST(request: NextRequest) {
  const config = lineConfig();
  const admin = createAdminClient();
  if (!config || !admin) return NextResponse.json({ error: "LINE is not configured" }, { status: 503 });

  const body = await request.text();
  if (!verifyLineSignature(body, request.headers.get("x-line-signature"), config.secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  const { events = [] } = JSON.parse(body) as { events?: LineEvent[] };
  for (const event of events) {
    const lineUserId = event.source?.userId;
    if (!event.replyToken || !lineUserId) continue;

    if (event.type === "follow") {
      await replyLine(event.replyToken, "ขอบคุณที่เพิ่มเพื่อน DormDee\nส่งรหัส 6 หลักจากหน้า “บัญชีของฉัน” มาที่แชทนี้ เพื่อรับแจ้งเตือนแชทและการจอง", config.token);
      continue;
    }
    if (event.type !== "message" || event.message?.type !== "text") continue;

    const code = event.message.text?.trim().toUpperCase() ?? "";
    if (!/^[0-9A-F]{6}$/.test(code)) {
      await replyLine(event.replyToken, "ส่งรหัส 6 หลักจากหน้า “บัญชีของฉัน” บนเว็บ DormDee เพื่อเชื่อมบัญชี", config.token);
      continue;
    }

    // A LINE account links to one DormDee account; drop any older link first.
    await admin.from("line_links").update({ line_user_id: null, linked_at: null }).eq("line_user_id", lineUserId);
    const { data } = await admin
      .from("line_links")
      .update({ line_user_id: lineUserId, linked_at: new Date().toISOString(), link_code: null })
      .eq("link_code", code)
      .select("user_id")
      .maybeSingle();
    await replyLine(
      event.replyToken,
      data ? "เชื่อมบัญชีสำเร็จ จากนี้คุณจะได้รับแจ้งเตือนแชทและการจองทาง LINE" : "รหัสไม่ถูกต้องหรือหมดอายุ ขอรหัสใหม่ได้ที่หน้า “บัญชีของฉัน”",
      config.token,
    );
  }
  return NextResponse.json({ ok: true });
}
