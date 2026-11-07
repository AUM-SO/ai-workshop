"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";

export type AuthResult = {
  error?: string;
  notice?: string;
  /** Set when the address still needs confirming; the form then offers to resend the link. */
  resendEmail?: string;
};

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

/** Supabase rate-limit errors say "...after N seconds"; tell the user how long to wait. */
function rateLimitMessage(text: string) {
  const seconds = Number(/(\d+)\s*seconds?/.exec(text)?.[1]);
  return seconds ? `ขอบ่อยเกินไป รออีก ${seconds} วินาทีแล้วลองใหม่` : MESSAGES.over_email_send_rate_limit;
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
  if (error) {
    if (error.code === "email_not_confirmed") return { error: MESSAGES.email_not_confirmed, resendEmail: email };
    return { error: message(error.code, "เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง") };
  }

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
    return { notice: `ส่งลิงก์ยืนยันไปที่ ${email} แล้ว เปิดอีเมลเพื่อยืนยันบัญชี (ถ้าไม่เจอ ลองดูในจดหมายขยะ)`, resendEmail: email };
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

/** Sends the sign-up confirmation link again. */
export async function resendVerification(email: string): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/` },
  });
  if (error) {
    const limited = error.code === "over_email_send_rate_limit" || error.status === 429;
    return { error: limited ? rateLimitMessage(error.message) : "ส่งลิงก์ไม่สำเร็จ ลองใหม่อีกครั้ง", resendEmail: email };
  }
  return { notice: `ส่งลิงก์ยืนยันใหม่ไปที่ ${email} แล้ว ถ้าไม่เจอ ลองดูในจดหมายขยะ`, resendEmail: email };
}

/** Emails a password-reset link. The reply is the same whether or not the address has an account. */
export async function requestPasswordReset(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "กรอกอีเมลให้ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  if (error && (error.code === "over_email_send_rate_limit" || error.status === 429)) {
    return { error: rateLimitMessage(error.message) };
  }
  return { notice: `ถ้า ${email} มีบัญชีอยู่ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปแล้ว ลิงก์ใช้ได้ครั้งเดียว ถ้าไม่เจอ ลองดูในจดหมายขยะ` };
}

/** Sets a new password for the session the reset link opened. */
export async function updatePassword(formData: FormData): Promise<AuthResult> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: MESSAGES.weak_password };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "ลิงก์หมดอายุหรือถูกใช้ไปแล้ว ขอลิงก์ใหม่ได้ที่หน้าลืมรหัสผ่าน" };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.code === "same_password" ? "รหัสผ่านใหม่ต้องไม่ซ้ำรหัสเดิม" : message(error.code, "ตั้งรหัสผ่านไม่สำเร็จ ลองใหม่อีกครั้ง") };
  }
  revalidatePath("/", "layout");
  redirect("/");
}
