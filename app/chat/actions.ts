"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { isUuid } from "@/lib/dorms/owner-ids";
import { dormTag, DORMS_TAG } from "@/lib/dorms/public";
import type { FormState } from "@/lib/dorms/schemas";
import { createClient } from "@/lib/supabase/server";
import { updateTag } from "next/cache";

const ERRORS: Record<string, string> = {
  not_allowed: "คุณไม่มีสิทธิ์ทำรายการนี้",
  dorm_not_available: "หอนี้ปิดประกาศแล้ว",
  room_type_not_found: "ไม่พบประเภทห้องนี้",
  move_in_in_past: "วันเข้าอยู่ต้องไม่ใช่วันที่ผ่านมาแล้ว",
  booking_already_open: "มีคำขอจองที่รอเจ้าของหอตอบอยู่แล้ว",
  booking_closed: "คำขอนี้ปิดไปแล้ว",
  room_required: "เลือกห้องก่อน",
  room_not_vacant: "ห้องนี้ไม่ว่างแล้ว เลือกห้องอื่น",
};

function errorMessage(message: string | undefined, fallback: string) {
  const code = Object.keys(ERRORS).find((key) => message?.includes(key));
  return code ? ERRORS[code] : fallback;
}

/** Opens (or reopens) the tenant's conversation with a dorm and goes to it. */
export async function startConversation(dormId: string, roomTypeId?: string) {
  const profile = await requireProfile(`/dorms/${dormId}`);
  if (!isUuid(dormId)) redirect("/search");
  const supabase = await createClient();

  const { data: existing } = await supabase.from("conversations").select("id").eq("dorm_id", dormId).eq("tenant_id", profile.id).maybeSingle();

  let conversationId = existing?.id;
  if (!conversationId) {
    const { data, error } = await supabase
      .from("conversations")
      // owner_id is replaced by the database with the dorm's owner.
      .insert({ dorm_id: dormId, tenant_id: profile.id, owner_id: profile.id })
      .select("id")
      .single();
    if (error || !data) {
      // Owners cannot open a chat with their own dorm (tenant and owner must differ).
      redirect(`/dorms/${dormId}?chat=unavailable`);
    }
    conversationId = data.id;
  }

  const book = roomTypeId && isUuid(roomTypeId) ? `?book=${roomTypeId}` : "";
  redirect(`/chat/${conversationId}${book}`);
}

export async function sendMessage(conversationId: string, body: string): Promise<FormState> {
  const profile = await requireProfile(`/chat/${conversationId}`);
  const text = body.trim();
  if (!text) return { error: "พิมพ์ข้อความก่อนส่ง" };
  if (text.length > 2000) return { error: "ข้อความยาวได้ไม่เกิน 2,000 ตัวอักษร" };

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: profile.id,
    body: text,
  });
  if (error) return { error: "ส่งข้อความไม่สำเร็จ ลองใหม่อีกครั้ง" };
  revalidatePath("/chat");
  return { ok: true };
}

const bookingSchema = z.object({
  room_type_id: z.uuid({ message: "เลือกประเภทห้อง" }),
  move_in: z.iso.date({ message: "เลือกวันเข้าอยู่" }),
  months: z.coerce.number().int().min(1, "อย่างน้อย 1 เดือน").max(60, "ไม่เกิน 60 เดือน"),
  note: z.string().trim().max(500, "ข้อความยาวได้ไม่เกิน 500 ตัวอักษร").default(""),
});

export async function requestBooking(conversationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireProfile(`/chat/${conversationId}`);
  const parsed = bookingSchema.safeParse({
    room_type_id: String(formData.get("room_type_id") ?? ""),
    move_in: String(formData.get("move_in") ?? ""),
    months: String(formData.get("months") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_booking", {
    target_conversation_id: conversationId,
    target_room_type_id: parsed.data.room_type_id,
    target_move_in: parsed.data.move_in,
    target_months: parsed.data.months,
    target_note: parsed.data.note,
  });
  if (error)
    return {
      error: errorMessage(error.message, "ส่งคำขอจองไม่สำเร็จ ลองใหม่อีกครั้ง"),
    };
  revalidatePath(`/chat/${conversationId}`);
  return { ok: true };
}

export async function respondBooking(bookingId: string, action: "hold" | "confirm" | "decline", roomId?: string, holdHours = 24): Promise<FormState> {
  await requireProfile("/chat");
  const supabase = await createClient();
  const { data: booking } = await supabase.from("bookings").select("dorm_id, conversation_id").eq("id", bookingId).maybeSingle();
  const { error } = await supabase.rpc("respond_booking", {
    target_booking_id: bookingId,
    action,
    target_room_id: roomId && isUuid(roomId) ? roomId : undefined,
    hold_hours: holdHours,
  });
  if (error)
    return {
      error: errorMessage(error.message, "ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง"),
    };

  // The room map and vacancy counts changed.
  if (booking) {
    updateTag(dormTag(booking.dorm_id));
    updateTag(DORMS_TAG);
    revalidatePath(`/owner/dorms/${booking.dorm_id}`, "layout");
    revalidatePath(`/chat/${booking.conversation_id}`);
  }
  return { ok: true };
}

export async function cancelBooking(bookingId: string): Promise<FormState> {
  await requireProfile("/chat");
  const supabase = await createClient();
  const { data: booking } = await supabase.from("bookings").select("dorm_id, conversation_id").eq("id", bookingId).maybeSingle();
  const { error } = await supabase.rpc("cancel_booking", {
    target_booking_id: bookingId,
  });
  if (error)
    return {
      error: errorMessage(error.message, "ยกเลิกไม่สำเร็จ ลองใหม่อีกครั้ง"),
    };
  if (booking) {
    updateTag(dormTag(booking.dorm_id));
    updateTag(DORMS_TAG);
    revalidatePath(`/chat/${booking.conversation_id}`);
  }
  return { ok: true };
}

/** Marks the conversation read for whichever side the caller is. */
export async function markConversationRead(conversationId: string) {
  const profile = await requireProfile(`/chat/${conversationId}`);
  const supabase = await createClient();
  const now = new Date().toISOString();
  await supabase.from("conversations").update({ tenant_last_read_at: now }).eq("id", conversationId).eq("tenant_id", profile.id);
  await supabase.from("conversations").update({ owner_last_read_at: now }).eq("id", conversationId).eq("owner_id", profile.id);
  await supabase.from("notifications").update({ read_at: now }).eq("user_id", profile.id).is("read_at", null).eq("link", `/chat/${conversationId}`);
}

export async function markAllNotificationsRead() {
  const profile = await requireProfile("/");
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", profile.id).is("read_at", null);
}
