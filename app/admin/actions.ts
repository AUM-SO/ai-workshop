"use server";

import { revalidatePath, updateTag } from "next/cache";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { flushLineNotifications } from "@/lib/line";
import { requireProfile } from "@/lib/auth";
import { isUuid } from "@/lib/dorms/owner-ids";
import { dormTag, DORMS_TAG } from "@/lib/dorms/public";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const profile = await requireProfile("/admin");
  if (profile.role !== "admin") notFound();
  return profile;
}

export async function reviewVerification(id: string, approve: boolean, message: string): Promise<{ error?: string }> {
  await requireAdmin();
  if (!isUuid(id)) return { error: "ไม่พบคำขอ" };
  const supabase = await createClient();
  const { data: request } = await supabase.from("owner_verifications").select("owner_id").eq("id", id).maybeSingle();
  const { error } = await supabase.rpc("review_verification", { target_id: id, approve, message: message || undefined });
  if (error) return { error: error.message.includes("verification_not_pending") ? "คำขอนี้ตรวจไปแล้ว" : "บันทึกไม่สำเร็จ" };

  // The badge shows on every dorm of this owner.
  if (approve && request) {
    const { data: dorms } = await supabase.from("dorms").select("id").eq("owner_id", request.owner_id);
    for (const dorm of dorms ?? []) updateTag(dormTag(dorm.id));
  }
  after(flushLineNotifications);
  revalidatePath("/admin");
  return {};
}

export async function setReportStatus(id: string, status: "resolved" | "dismissed"): Promise<{ error?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("reports").update({ status, resolved_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: "บันทึกไม่สำเร็จ" };
  revalidatePath("/admin");
  return {};
}

/** Takes a reported listing off the site; the owner can fix it and publish again. */
export async function archiveDorm(dormId: string): Promise<{ error?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("dorms").update({ status: "archived" }).eq("id", dormId);
  if (error) return { error: "ปิดประกาศไม่สำเร็จ" };
  updateTag(dormTag(dormId));
  updateTag(DORMS_TAG);
  revalidatePath("/admin");
  return {};
}
