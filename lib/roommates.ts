import type { Database } from "@/lib/supabase/database.types";

export type RoommateProfile = Database["public"]["Tables"]["roommate_profiles"]["Row"];

export const SLEEP = { early: "นอนเร็ว ตื่นเช้า", late: "นอนดึก ตื่นสาย", flexible: "แล้วแต่วัน" } as const;
export const GUESTS = { rarely: "แทบไม่พาใครมา", sometimes: "มีเพื่อนมาบ้าง", often: "เพื่อนมาบ่อย" } as const;
export const GENDER = { male: "ชาย", female: "หญิง", other: "ไม่ระบุ / อื่น ๆ" } as const;
export const CLEANLINESS = { 1: "สบาย ๆ", 2: "เรียบร้อยพอประมาณ", 3: "เป๊ะ สะอาดมาก" } as const;

/**
 * 0–100 compatibility between two people. Hard mismatches (province, gender
 * preference) return 0; the rest are weighted lifestyle differences.
 */
export function matchScore(me: RoommateProfile, other: RoommateProfile) {
  if (me.province !== other.province) return 0;
  if ((me.prefer_same_gender || other.prefer_same_gender) && me.gender !== other.gender) return 0;

  let score = 100;
  // Budget: both should afford a shared room in a similar range.
  const budgetGap = Math.abs(me.budget_max - other.budget_max) / Math.max(me.budget_max, other.budget_max);
  score -= Math.min(25, Math.round(budgetGap * 50));
  if (me.sleep !== other.sleep && me.sleep !== "flexible" && other.sleep !== "flexible") score -= 20;
  score -= Math.abs(me.cleanliness - other.cleanliness) * 10;
  if (me.smoking !== other.smoking) score -= 20;
  if (me.pets !== other.pets) score -= 10;
  const guestLevels = ["rarely", "sometimes", "often"];
  score -= Math.abs(guestLevels.indexOf(me.guests) - guestLevels.indexOf(other.guests)) * 5;
  return Math.max(0, score);
}
