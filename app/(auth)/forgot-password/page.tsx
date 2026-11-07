import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "ลืมรหัสผ่าน" };

export default function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-12">
      <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-title-2-medium text-text-primary">ลืมรหัสผ่าน</h1>
          <p className="text-body-regular text-text-secondary">กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้</p>
        </div>
        <Suspense fallback={<ForgotPasswordForm />}>
          <WithError searchParams={searchParams} />
        </Suspense>
        <Link
          href="/login"
          className="self-center rounded-sm text-body-medium text-text-secondary outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring"
        >
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}

async function WithError({ searchParams }: Pick<PageProps<"/forgot-password">, "searchParams">) {
  const { error } = await searchParams;
  return <ForgotPasswordForm initialError={error ? "ลิงก์ตั้งรหัสผ่านหมดอายุหรือถูกใช้ไปแล้ว ขอลิงก์ใหม่ได้ด้านล่าง" : undefined} />;
}
