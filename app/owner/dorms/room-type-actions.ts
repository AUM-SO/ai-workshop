"use server";

import { refreshDorm } from "@/lib/dorms/refresh";
import { redirect } from "next/navigation";
import { getOwnedDorm, isUuid } from "@/lib/dorms/owner";
import { fieldErrors, roomTypeSchema, type FormState } from "@/lib/dorms/schemas";
import { createClient } from "@/lib/supabase/server";

/** Reads the repeatable "other fees" rows posted as other_fees.<i>.label / .amount / .monthly. */
function readOtherFees(formData: FormData) {
  const indexes = new Set<number>();
  for (const key of formData.keys()) {
    const match = key.match(/^other_fees\.(\d+)\./);
    if (match) indexes.add(Number(match[1]));
  }
  return [...indexes]
    .sort((a, b) => a - b)
    .map((i) => ({
      label: String(formData.get(`other_fees.${i}.label`) ?? ""),
      amount: String(formData.get(`other_fees.${i}.amount`) ?? ""),
      monthly: formData.get(`other_fees.${i}.monthly`) === "true",
    }))
    // A row left completely empty is ignored rather than reported.
    .filter((fee) => fee.label.trim() !== "" || fee.amount.trim() !== "");
}

export async function saveRoomType(
  dormId: string,
  roomTypeId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const dorm = await getOwnedDorm(dormId);
  const text = (key: string) => String(formData.get(key) ?? "");

  const parsed = roomTypeSchema.safeParse({
    name: text("name"),
    size_sqm: text("size_sqm"),
    monthly_price: text("monthly_price"),
    deposit: text("deposit") || "0",
    advance_months: text("advance_months") || "0",
    water_mode: text("water_mode"),
    water_rate: text("water_rate"),
    water_flat: text("water_flat"),
    electric_rate: text("electric_rate"),
    furniture: formData.getAll("furniture").map(String),
    other_fees: readOtherFees(formData),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { water_mode, ...values } = parsed.data;
  const row = {
    ...values,
    // Only the water charge that matches the chosen mode is kept.
    water_rate: water_mode === "metered" ? values.water_rate : null,
    water_flat: water_mode === "flat" ? values.water_flat : null,
  };

  const supabase = await createClient();
  if (roomTypeId) {
    if (!isUuid(roomTypeId)) return { error: "ไม่พบประเภทห้องนี้" };
    const { error } = await supabase.from("room_types").update(row).eq("id", roomTypeId).eq("dorm_id", dorm.id);
    if (error) return { error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" };
  } else {
    const { error } = await supabase.from("room_types").insert({ ...row, dorm_id: dorm.id });
    if (error) return { error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }

  refreshDorm(dorm.id);
  redirect(`/owner/dorms/${dorm.id}/room-types`);
}

export async function deleteRoomType(dormId: string, roomTypeId: string): Promise<FormState> {
  const dorm = await getOwnedDorm(dormId);
  if (!isUuid(roomTypeId)) return { error: "ไม่พบประเภทห้องนี้" };
  const supabase = await createClient();

  if (dorm.status === "published") {
    // A published dorm must keep at least one room; check what would be left.
    const { count } = await supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("dorm_id", dorm.id)
      .neq("room_type_id", roomTypeId);
    if ((count ?? 0) === 0) {
      return { error: "หอที่เผยแพร่อยู่ต้องมีห้องอย่างน้อย 1 ห้อง ปิดประกาศก่อนถ้าจะลบประเภทห้องนี้" };
    }
  }

  // Rooms of this type are deleted with it (on delete cascade).
  const { error } = await supabase.from("room_types").delete().eq("id", roomTypeId).eq("dorm_id", dorm.id);
  if (error) return { error: "ลบไม่สำเร็จ ลองใหม่อีกครั้ง" };

  refreshDorm(dorm.id);
  return { ok: true };
}
