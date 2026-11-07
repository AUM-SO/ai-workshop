"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { PROVINCES } from "@/lib/dorms/options";
import type { FormState } from "@/lib/dorms/schemas";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  province: z.enum(PROVINCES as unknown as [string, ...string[]], { error: "เลือกจังหวัด" }),
  budget_max: z.coerce.number({ error: "ใส่งบต่อเดือน" }).int().min(1000, "อย่างน้อย 1,000 บาท").max(100000, "ไม่เกิน 100,000 บาท"),
  gender: z.enum(["male", "female", "other"], { error: "เลือกเพศ" }),
  prefer_same_gender: z.literal("on").optional(),
  sleep: z.enum(["early", "late", "flexible"], { error: "เลือกเวลานอน" }),
  cleanliness: z.coerce.number().int().min(1).max(3),
  smoking: z.literal("on").optional(),
  pets: z.literal("on").optional(),
  guests: z.enum(["rarely", "sometimes", "often"], { error: "เลือกข้อนี้" }),
  bio: z.string().trim().max(500, "ไม่เกิน 500 ตัวอักษร").optional(),
  contact: z.string().trim().max(100, "ไม่เกิน 100 ตัวอักษร").optional(),
  active: z.literal("on").optional(),
});

export async function saveRoommateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile("/roommates");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  }
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("roommate_profiles").upsert({
    user_id: profile.id,
    province: v.province,
    budget_max: v.budget_max,
    gender: v.gender,
    prefer_same_gender: v.prefer_same_gender === "on",
    sleep: v.sleep,
    cleanliness: v.cleanliness,
    smoking: v.smoking === "on",
    pets: v.pets === "on",
    guests: v.guests,
    bio: v.bio || null,
    contact: v.contact || null,
    active: v.active === "on",
  });
  if (error) return { error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" };
  revalidatePath("/roommates");
  return { ok: true, message: "บันทึกแล้ว" };
}
