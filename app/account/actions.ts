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
