"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { isUuid } from "@/lib/dorms/owner-ids";
import { dormTag } from "@/lib/dorms/public";
import type { FormState } from "@/lib/dorms/schemas";
import { createClient } from "@/lib/supabase/server";

/** Turns "notify me when a room of this type is free" on or off. */
export async function toggleWatch(dormId: string, roomTypeId: string, watch: boolean): Promise<{ error?: string }> {
  const profile = await requireProfile(`/dorms/${dormId}`);
  if (!isUuid(roomTypeId)) return { error: "ไม่พบประเภทห้องนี้" };
  const supabase = await createClient();
  const { error } = watch
    ? await supabase.from("room_type_watches").upsert({ user_id: profile.id, room_type_id: roomTypeId }, { ignoreDuplicates: true })
    : await supabase.from("room_type_watches").delete().eq("user_id", profile.id).eq("room_type_id", roomTypeId);
  return error ? { error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" } : {};
}

const reviewSchema = z.object({
  booking_id: z.uuid(),
  rating: z.coerce.number().int().min(1, "ให้คะแนน 1–5 ดาว").max(5, "ให้คะแนน 1–5 ดาว"),
  body: z.string().trim().max(1000, "ยาวได้ไม่เกิน 1,000 ตัวอักษร").optional(),
});

export async function submitReview(dormId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile(`/dorms/${dormId}`);
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").insert({
    dorm_id: dormId,
    booking_id: parsed.data.booking_id,
    tenant_id: profile.id,
    rating: parsed.data.rating,
    body: parsed.data.body || null,
  });
  if (error) {
    return { error: error.code === "23505" ? "คุณรีวิวการจองนี้ไปแล้ว" : "รีวิวได้เฉพาะคนที่จองห้องผ่าน DormDee และเจ้าของหอยืนยันแล้ว" };
  }
  updateTag(dormTag(dormId));
  return { ok: true };
}

export async function deleteReview(dormId: string, reviewId: string): Promise<{ error?: string }> {
  await requireProfile(`/dorms/${dormId}`);
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) return { error: "ลบรีวิวไม่สำเร็จ" };
  updateTag(dormTag(dormId));
  return {};
}

const reportSchema = z.object({
  reason: z.enum(["scam", "wrong_info", "unavailable", "other"], { error: "เลือกเหตุผล" }),
  details: z.string().trim().max(1000, "ยาวได้ไม่เกิน 1,000 ตัวอักษร").optional(),
});

export async function reportDorm(dormId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile(`/dorms/${dormId}`);
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    dorm_id: dormId,
    reporter_id: profile.id,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
  });
  return error ? { error: "ส่งรายงานไม่สำเร็จ ลองใหม่อีกครั้ง" } : { ok: true, message: "ขอบคุณที่แจ้ง ทีมงานจะตรวจสอบโดยเร็ว" };
}
