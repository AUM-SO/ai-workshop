"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileResult = { error?: string; saved?: boolean };

export async function updateProfile(_prev: ProfileResult, formData: FormData): Promise<ProfileResult> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const role = formData.get("role") === "owner" ? "owner" : "tenant";
  if (!displayName) return { error: "กรอกชื่อที่แสดง" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "เซสชันหมดอายุ เข้าสู่ระบบอีกครั้ง" };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, role })
    .eq("id", user.id)
    .neq("role", "admin");
  if (error) return { error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" };

  revalidatePath("/", "layout");
  return { saved: true };
}

/** A fresh 6-character code to send to the LINE bot. */
export async function createLineCode(): Promise<{ code?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_line_link_code");
  return error || !data ? { error: "สร้างรหัสไม่สำเร็จ ลองใหม่อีกครั้ง" } : { code: data };
}

export async function unlinkLine(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };
  const { error } = await supabase.from("line_links").delete().eq("user_id", user.id);
  revalidatePath("/account");
  return error ? { error: "ยกเลิกไม่สำเร็จ" } : {};
}
