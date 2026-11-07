"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

const DELETE_ERRORS: Record<string, string> = {
  has_published_dorms: "ยังมีหอที่เผยแพร่อยู่ ปิดประกาศหอทั้งหมดก่อนลบบัญชี",
  has_open_bookings: "ยังมีคำขอจองที่รอตอบหรือกันห้องไว้ ปิดหรือยกเลิกให้เรียบร้อยก่อนลบบัญชี",
};

/** Removes files the user uploaded under their own folder, best effort. */
async function removeOwnFiles(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  for (const bucket of ["dorm-photos", "verification-docs", "deposit-slips"]) {
    const storage = supabase.storage.from(bucket);
    const { data: top } = await storage.list(userId, { limit: 1000 });
    const paths: string[] = [];
    for (const item of top ?? []) {
      // Folders (dorm or booking ids) have no id; list one level into them.
      if (item.id) paths.push(`${userId}/${item.name}`);
      else {
        const { data: inner } = await storage.list(`${userId}/${item.name}`, { limit: 1000 });
        for (const file of inner ?? []) paths.push(`${userId}/${item.name}/${file.name}`);
      }
    }
    if (paths.length) await storage.remove(paths);
  }
}

/** PDPA: deletes the signed-in account and everything linked to it, then signs out. */
export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  // Check the blockers before touching any files.
  const [{ count: published }, { count: open }] = await Promise.all([
    supabase.from("dorms").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("status", "published"),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .or(`owner_id.eq.${user.id},tenant_id.eq.${user.id}`)
      .in("status", ["pending", "held"]),
  ]);
  if (published) return { error: DELETE_ERRORS.has_published_dorms };
  if (open) return { error: DELETE_ERRORS.has_open_bookings };

  await removeOwnFiles(supabase, user.id);
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    const code = Object.keys(DELETE_ERRORS).find((key) => error.message.includes(key));
    return { error: code ? DELETE_ERRORS[code] : "ลบบัญชีไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/?account=deleted");
}
