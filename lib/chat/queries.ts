import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/dorms/owner-ids";
import { parseOtherFees } from "@/lib/dorms/costs";

/** The signed-in user's conversations (as tenant or owner), newest first, with unread state. */
export async function listConversations(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("*, dorms(name, cover_url)")
    .or(`tenant_id.eq.${userId},owner_id.eq.${userId}`)
    .order("last_message_at", { ascending: false })
    .limit(100);
  const conversations = data ?? [];
  if (!conversations.length) return [];

  const ids = conversations.map((c) => c.id);
  const others = [...new Set(conversations.map((c) => (c.tenant_id === userId ? c.owner_id : c.tenant_id)))];
  const [{ data: profiles }, { data: lastMessages }] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", others),
    // The latest message per conversation, for the preview line.
    supabase.from("messages").select("conversation_id, body, kind, created_at").in("conversation_id", ids).order("created_at", { ascending: false }).limit(500),
  ]);
  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  const preview = new Map<string, string>();
  for (const m of lastMessages ?? []) if (!preview.has(m.conversation_id)) preview.set(m.conversation_id, m.body);

  return conversations.map((c) => {
    const asTenant = c.tenant_id === userId;
    const lastRead = asTenant ? c.tenant_last_read_at : c.owner_last_read_at;
    return {
      id: c.id,
      dormId: c.dorm_id,
      dormName: c.dorms?.name ?? "หอพัก",
      cover: c.dorms?.cover_url ?? null,
      role: asTenant ? ("tenant" as const) : ("owner" as const),
      otherName: nameOf.get(asTenant ? c.owner_id : c.tenant_id) ?? (asTenant ? "เจ้าของหอ" : "ผู้เช่า"),
      preview: preview.get(c.id) ?? "",
      lastMessageAt: c.last_message_at,
      unread: new Date(c.last_message_at) > new Date(lastRead),
    };
  });
}

/** Everything the thread page needs; null when the caller is not a participant. */
export async function getThread(conversationId: string, userId: string) {
  if (!isUuid(conversationId)) return null;
  const supabase = await createClient();
  const { data: conversation } = await supabase.from("conversations").select("*").eq("id", conversationId).maybeSingle();
  if (!conversation) return null;

  const [dorm, messages, bookings, roomTypes, profiles] = await Promise.all([
    supabase.from("dorms").select("id, name, cover_url, status").eq("id", conversation.dorm_id).maybeSingle(),
    supabase.from("messages").select("*").eq("conversation_id", conversation.id).order("created_at").limit(300),
    supabase.from("bookings").select("*").eq("conversation_id", conversation.id).order("created_at"),
    supabase.from("room_types").select("*").eq("dorm_id", conversation.dorm_id).order("monthly_price"),
    supabase.from("profiles").select("id, display_name").in("id", [conversation.tenant_id, conversation.owner_id]),
  ]);

  const isOwner = conversation.owner_id === userId;
  // Owners pick a room when holding or confirming; tenants never see room numbers they can't book.
  const { data: rooms } = isOwner
    ? await supabase.from("rooms").select("id, room_no, floor, status, room_type_id").eq("dorm_id", conversation.dorm_id)
    : { data: [] };

  const nameOf = new Map((profiles.data ?? []).map((p) => [p.id, p.display_name]));
  return {
    conversation,
    role: isOwner ? ("owner" as const) : ("tenant" as const),
    dorm: dorm.data,
    tenantName: nameOf.get(conversation.tenant_id) ?? "ผู้เช่า",
    ownerName: nameOf.get(conversation.owner_id) ?? "เจ้าของหอ",
    messages: messages.data ?? [],
    bookings: bookings.data ?? [],
    roomTypes: (roomTypes.data ?? []).map((t) => ({ ...t, other_fees: parseOtherFees(t.other_fees) })),
    rooms: rooms ?? [],
  };
}

export type Thread = NonNullable<Awaited<ReturnType<typeof getThread>>>;
