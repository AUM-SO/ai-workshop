import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentProfile, safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

const CALLBACK_ERRORS: Record<string, string> = {
  callback: "ลิงก์หมดอายุหรือถูกใช้ไปแล้ว หรือเข้าสู่ระบบด้วย Google ไม่สำเร็จ ลองใหม่อีกครั้ง",
  missing_code: "ลิงก์ไม่สมบูรณ์ ลองเปิดลิงก์จากอีเมลอีกครั้ง หรือเข้าสู่ระบบด้วยวิธีอื่น",
  access_denied: "คุณยกเลิกการเข้าสู่ระบบด้วย Google",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-12">
      <Suspense>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function LoginContent({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { next, error } = await searchParams;
  const target = safeNext(typeof next === "string" ? next : undefined);
  if (await getCurrentProfile()) redirect(target);

  return <AuthForm mode="signin" next={target} initialError={typeof error === "string" ? CALLBACK_ERRORS[error] ?? CALLBACK_ERRORS.callback : undefined} />;
}
