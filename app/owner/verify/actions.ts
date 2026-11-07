"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Files the request after the browser has uploaded the document to the private bucket. */
export async function requestVerification(documentPath: string, note: string): Promise<{ error?: string }> {
  const profile = await requireProfile("/owner/verify");
  if (!documentPath.startsWith(`${profile.id}/`)) return { error: "ไฟล์ไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.from("owner_verifications").insert({
    owner_id: profile.id,
    document_path: documentPath,
    note: note.trim().slice(0, 500) || null,
  });
  if (error) {
    return { error: error.code === "23505" ? "มีคำขอที่รอตรวจอยู่แล้ว" : "ส่งคำขอไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
  revalidatePath("/owner/verify");
  return {};
}
