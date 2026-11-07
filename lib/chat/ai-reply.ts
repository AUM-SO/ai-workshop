import Anthropic from "@anthropic-ai/sdk";
import { baht, moveInTotal, parseOtherFees } from "@/lib/dorms/costs";
import { AMENITIES, FURNITURE, GENDER_POLICY_LABEL } from "@/lib/dorms/options";
import { createAdminClient } from "@/lib/supabase/admin";

// AI auto-reply: while the owner is away, Claude answers a tenant's question from the
// dorm's own data. Needs ANTHROPIC_API_KEY and SUPABASE_SECRET_KEY (the reply is
// written with the service key, since clients can only post as themselves).

const MODEL = "claude-opus-5-5";
/** The owner counts as away when they have not read or written in this long. */
const AWAY_MS = 10 * 60 * 1000;
const HISTORY = 20;

export function aiReplyAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY && process.env.SUPABASE_SECRET_KEY);
}

const SYSTEM = `You are the assistant for a dorm listing on DormDee, a Thai dorm rental platform. The owner is away right now, and you reply to a prospective tenant in the chat on the owner's behalf.

How to answer:
- Answer only from the dorm facts below and the conversation. If a fact is not listed, say you are not sure and that the owner will confirm when they are back. Never invent prices, availability, rules or promises.
- Reply in the language the tenant wrote in (usually Thai), in a friendly, short chat style: one to four sentences, no headings, no markdown.
- For booking, holding a room, discounts, negotiation, viewing appointments, contracts or anything only the owner can decide, say the owner will follow up. For booking, point the tenant to the "ขอจองห้อง" button at the top of the chat, which sends a request the owner confirms in the system.
- Never ask for, or agree to, any money transfer or bank details. If the tenant asks how to pay, say the deposit is paid only after the owner confirms the booking in the system, and the tenant should see the room before paying.
- If the message is only a greeting or thanks, reply briefly and offer help.`;

function describeDorm(data: DormFacts) {
  const amenity = new Map<string, string>(AMENITIES.map((a) => [a.key, a.label]));
  const furniture = new Map<string, string>(FURNITURE.map((f) => [f.key, f.label]));
  const { dorm, types, vacancy } = data;
  const lines = [
    `Name: ${dorm.name}`,
    `Type: ${GENDER_POLICY_LABEL[dorm.gender_policy]}`,
    `Address: ${[dorm.address, dorm.district, dorm.province].filter(Boolean).join(" ")}`,
    dorm.nearby.length ? `Nearby: ${dorm.nearby.join(", ")}` : null,
    dorm.amenities.length ? `Amenities: ${dorm.amenities.map((a) => amenity.get(a) ?? a).join(", ")}` : null,
    dorm.rules ? `Rules: ${dorm.rules}` : null,
    dorm.description ? `Description: ${dorm.description}` : null,
    "Room types:",
    ...types.map((t) => {
      const fees = parseOtherFees(t.other_fees)
        .map((f) => `${f.label} ${baht(f.amount)}${f.monthly ? "/month" : " once"}`)
        .join(", ");
      return [
        `- ${t.name}${t.size_sqm ? ` (${t.size_sqm} sq m)` : ""}: rent ${baht(t.monthly_price)}/month`,
        `deposit ${baht(t.deposit)}, ${t.advance_months} month(s) rent in advance, due at move-in ${baht(moveInTotal({ ...t, other_fees: parseOtherFees(t.other_fees) }))}`,
        `water ${t.water_flat != null ? `${baht(t.water_flat)}/month flat` : `${t.water_rate ?? "?"} THB/unit`}`,
        `electricity ${t.electric_rate != null ? `${t.electric_rate} THB/unit` : "at the utility rate"}`,
        t.furniture.length ? `furniture: ${t.furniture.map((f) => furniture.get(f) ?? f).join(", ")}` : null,
        fees ? `other fees: ${fees}` : null,
        `vacant now: ${vacancy.get(t.id) ?? 0}`,
      ]
        .filter(Boolean)
        .join("; ");
    }),
  ];
  return lines.filter(Boolean).join("\n");
}

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;
type DormFacts = Awaited<ReturnType<typeof loadDorm>>;

async function loadDorm(admin: Admin, dormId: string) {
  const [{ data: dorm }, { data: types }, { data: rooms }] = await Promise.all([
    admin.from("dorms").select("*").eq("id", dormId).single(),
    admin.from("room_types").select("*").eq("dorm_id", dormId).order("monthly_price"),
    admin.from("rooms").select("room_type_id, status").eq("dorm_id", dormId),
  ]);
  const vacancy = new Map<string, number>();
  for (const r of rooms ?? []) if (r.status === "vacant" && r.room_type_id) vacancy.set(r.room_type_id, (vacancy.get(r.room_type_id) ?? 0) + 1);
  return { dorm: dorm!, types: types ?? [], vacancy };
}

/**
 * Replies to the tenant's latest message if the dorm has AI replies on and the owner is
 * away. Run it with `after()` so the tenant's send is not delayed; it never throws.
 */
export async function maybeAutoReply(conversationId: string) {
  if (!aiReplyAvailable()) return;
  const admin = createAdminClient();
  if (!admin) return;
  try {
    const { data: conversation } = await admin.from("conversations").select("*").eq("id", conversationId).single();
    if (!conversation) return;
    const { data: dorm } = await admin.from("dorms").select("ai_reply_enabled, status").eq("id", conversation.dorm_id).single();
    if (!dorm?.ai_reply_enabled || dorm.status !== "published") return;

    const { data: recent } = await admin
      .from("messages")
      .select("sender_id, kind, body, via, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(HISTORY);
    const history = (recent ?? []).reverse();
    const last = history.at(-1);
    // Only answer a fresh text from the tenant.
    if (!last || last.kind !== "text" || last.sender_id !== conversation.tenant_id) return;

    const now = Date.now();
    const ownerWrote = history.some((m) => m.sender_id === conversation.owner_id && !m.via && now - Date.parse(m.created_at) < AWAY_MS);
    const ownerRead = now - Date.parse(conversation.owner_last_read_at) < AWAY_MS;
    if (ownerWrote || ownerRead) return;

    const facts = describeDorm(await loadDorm(admin, conversation.dorm_id));

    // Chat turns as user/assistant; system notes become bracketed context in the
    // tenant's turn. Consecutive same-role turns are merged by the API.
    const messages: Anthropic.MessageParam[] = history
      .filter((m) => m.body)
      .map((m) =>
        m.sender_id === conversation.tenant_id && m.kind !== "system"
          ? { role: "user" as const, content: m.body }
          : m.kind === "system"
            ? { role: "user" as const, content: `[system note: ${m.body}]` }
            : { role: "assistant" as const, content: m.body },
      );
    while (messages.length && messages[0].role !== "user") messages.shift();
    if (!messages.length) return;

    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [
        { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
        { type: "text", text: `Dorm facts:\n${facts}` },
      ],
      messages,
    });
    if (response.stop_reason === "refusal") return;
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!text) return;

    await admin.from("messages").insert({
      conversation_id: conversationId,
      sender_id: conversation.owner_id,
      kind: "text",
      body: text.slice(0, 2000),
      via: "ai",
    });
  } catch (error) {
    console.error("AI auto-reply failed", error);
  }
}
