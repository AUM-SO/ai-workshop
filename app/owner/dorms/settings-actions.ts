"use server";

import { getOwnedDorm } from "@/lib/dorms/owner";
import { refreshDorm } from "@/lib/dorms/refresh";
import type { FormState } from "@/lib/dorms/schemas";
import { createClient } from "@/lib/supabase/server";

/** PromptPay receiver for deposits and the AI auto-reply switch. */
export async function updateBookingSettings(dormId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const dorm = await getOwnedDorm(dormId);
  const promptpay = String(formData.get("promptpay_id") ?? "").replace(/[\s-]/g, "");
  if (promptpay && !/^(0\d{9}|\d{13})$/.test(promptpay)) {
    return { fieldErrors: { promptpay_id: "ใส่เบอร์มือถือ 10 หลัก หรือเลขบัตรประชาชน / เลขผู้เสียภาษี 13 หลัก" } };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("dorms")
    .update({ promptpay_id: promptpay || null, ai_reply_enabled: formData.get("ai_reply_enabled") === "on" })
    .eq("id", dorm.id);
  if (error) return { error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" };
  refreshDorm(dorm.id);
  return { ok: true, message: "บันทึกแล้ว" };
}
