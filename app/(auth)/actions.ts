"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";

export type AuthResult = { error?: string; notice?: string };

const MESSAGES: Record<string, string> = {
  invalid_credentials: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  email_not_confirmed: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ",
  user_already_exists: "อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน",
  weak_password: "รหัสผ่านสั้นหรือง่ายเกินไป ใช้อย่างน้อย 8 ตัวอักษร",
  over_email_send_rate_limit: "ส่งอีเมลบ่อยเกินไป รอสักครู่แล้วลองใหม่",
};

function message(code: string | undefined, fallback: string) {
  return (code && MESSAGES[code]) || fallback;
}

async function siteOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: message(error.code, "เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง") };

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "owner" ? "owner" : "tenant";

  if (password.length < 8) return { error: MESSAGES.weak_password };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name, role },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${role === "owner" ? "/owner" : "/"}`,
    },
  });
  if (error) return { error: message(error.code, "สมัครสมาชิกไม่สำเร็จ ลองใหม่อีกครั้ง") };

  // With email confirmation on, there is no session until the link is clicked.
  if (!data.session) {
    return { notice: `ส่งลิงก์ยืนยันไปที่ ${email} แล้ว เปิดอีเมลเพื่อยืนยันบัญชี` };
  }

  revalidatePath("/", "layout");
  redirect(role === "owner" ? "/owner" : "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
