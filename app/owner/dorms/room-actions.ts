"use server";

import { after } from "next/server";
import { flushLineNotifications } from "@/lib/line";
import { refreshDorm } from "@/lib/dorms/refresh";
import { getOwnedDorm, isUuid } from "@/lib/dorms/owner";
import { ROOM_STATUSES, type RoomStatus } from "@/lib/dorms/options";
import { bulkRoomsSchema, fieldErrors, type FormState } from "@/lib/dorms/schemas";
import { createClient } from "@/lib/supabase/server";

function revalidate(dormId: string) {
  refreshDorm(dormId);
}

const normalise = (roomNo: string) => roomNo.trim().toLowerCase();

/** Adds rooms `<prefix><from>` … `<prefix><to>` on one floor; numbers already in the dorm are skipped. */
export async function addRooms(dormId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const dorm = await getOwnedDorm(dormId);
  const parsed = bulkRoomsSchema.safeParse({
    room_type_id: String(formData.get("room_type_id") ?? ""),
    floor: String(formData.get("floor") ?? ""),
    prefix: String(formData.get("prefix") ?? ""),
    from: String(formData.get("from") ?? ""),
    to: String(formData.get("to") ?? ""),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { room_type_id, floor, prefix, from, to } = parsed.data;

  const supabase = await createClient();
  const { data: type } = await supabase
    .from("room_types")
    .select("id")
    .eq("id", room_type_id)
    .eq("dorm_id", dorm.id)
    .maybeSingle();
  if (!type) return { fieldErrors: { room_type_id: "เลือกประเภทห้อง" } };

  const { data: existing } = await supabase.from("rooms").select("room_no").eq("dorm_id", dorm.id);
  const taken = new Set((existing ?? []).map((r) => normalise(r.room_no)));

  const wanted = Array.from({ length: to - from + 1 }, (_, i) => `${prefix}${from + i}`);
  const fresh = wanted.filter((no) => !taken.has(normalise(no)));
  const skipped = wanted.length - fresh.length;

  if (fresh.length === 0) {
    return { error: `ห้อง ${wanted[0]}${wanted.length > 1 ? `–${wanted.at(-1)}` : ""} มีอยู่แล้วทั้งหมด` };
  }

  // dorm_id is filled in by the database from the room type.
  const { error } = await supabase
    .from("rooms")
    .insert(fresh.map((room_no) => ({ room_type_id, room_no, floor, dorm_id: dorm.id })));
  if (error) return { error: "เพิ่มห้องไม่สำเร็จ ลองใหม่อีกครั้ง" };

  revalidate(dorm.id);
  return {
    ok: true,
    message: skipped
      ? `เพิ่ม ${fresh.length} ห้อง ข้าม ${skipped} ห้องที่มีอยู่แล้ว`
      : `เพิ่ม ${fresh.length} ห้องแล้ว`,
  };
}

export async function setRoomStatus(dormId: string, roomId: string, status: RoomStatus): Promise<FormState> {
  const dorm = await getOwnedDorm(dormId);
  if (!isUuid(roomId) || !ROOM_STATUSES.includes(status)) return { error: "ข้อมูลไม่ถูกต้อง" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("rooms")
    // A manual change ends any hold placed by a booking.
    .update({ status, held_until: null })
    .eq("id", roomId)
    .eq("dorm_id", dorm.id);
  if (error) return { error: "เปลี่ยนสถานะไม่สำเร็จ ลองใหม่อีกครั้ง" };

  revalidate(dorm.id);
  // A room turning vacant notifies waitlisted tenants; relay that to LINE too.
  after(flushLineNotifications);
  return { ok: true };
}

export async function deleteRoom(dormId: string, roomId: string): Promise<FormState> {
  const dorm = await getOwnedDorm(dormId);
  if (!isUuid(roomId)) return { error: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();

  if (dorm.status === "published") {
    const { count } = await supabase.from("rooms").select("id", { count: "exact", head: true }).eq("dorm_id", dorm.id);
    if ((count ?? 0) <= 1) return { error: "หอที่เผยแพร่อยู่ต้องมีห้องอย่างน้อย 1 ห้อง" };
  }

  const { error } = await supabase.from("rooms").delete().eq("id", roomId).eq("dorm_id", dorm.id);
  if (error) return { error: "ลบห้องไม่สำเร็จ ลองใหม่อีกครั้ง" };

  revalidate(dorm.id);
  return { ok: true };
}
