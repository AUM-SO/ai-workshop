import { Suspense } from "react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/base/buttons/button";
import { ResetPasswordForm } from "@/components/auth/password-forms";
import { getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "ตั้งรหัสผ่านใหม่", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-12">
      <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-6 shadow-sm">
        <h1 className="text-title-2-medium text-text-primary">ตั้งรหัสผ่านใหม่</h1>
        <Suspense fallback={<p className="text-body-regular text-text-secondary">กำลังโหลด…</p>}>
          <ResetContent />
        </Suspense>
      </div>
    </div>
  );
}

/** The reset link signs the user in through /auth/callback; without that session the link has expired. */
async function ResetContent() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-body-regular text-text-secondary">ลิงก์หมดอายุหรือถูกใช้ไปแล้ว ขอลิงก์ใหม่ได้เลย</p>
        <ButtonLink href="/forgot-password">ขอลิงก์ใหม่</ButtonLink>
      </div>
    );
  }
  return (
    <>
      <p className="text-body-regular text-text-secondary">บัญชี {profile.email}</p>
      <ResetPasswordForm />
    </>
  );
}
