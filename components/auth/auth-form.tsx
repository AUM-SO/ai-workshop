"use client";

import { useState, useTransition } from "react";
import { AuthCard } from "@/components/application/auth/auth-card";
import { RadioCard } from "@/components/base/radio/radio-card";
import { RadioGroup } from "@/components/base/radio/radio";
import { createClient } from "@/lib/supabase/client";
import { signIn, signUp, type AuthResult } from "@/app/(auth)/actions";

type Role = "tenant" | "owner";

interface AuthFormProps {
  mode: "signin" | "signup";
  next?: string;
  initialRole?: Role;
}

export function AuthForm({ mode, next = "/", initialRole = "tenant" }: AuthFormProps) {
  const [role, setRole] = useState<Role>(initialRole);
  const [result, setResult] = useState<AuthResult>({});
  const [pending, startTransition] = useTransition();
  const signup = mode === "signup";

  const submit = (data: FormData) => {
    data.set("next", next);
    if (signup) data.set("role", role);
    setResult({});
    startTransition(async () => {
      // A successful action redirects, so only failures and notices come back.
      const res = await (signup ? signUp(data) : signIn(data));
      if (res) setResult(res);
    });
  };

  const continueWithGoogle = async () => {
    setResult({});
    const params = new URLSearchParams({ next: signup && role === "owner" ? "/owner" : next });
    if (signup) params.set("role", role);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?${params}` },
    });
    if (error) setResult({ error: "ยังเข้าสู่ระบบด้วย Google ไม่ได้ในตอนนี้ ลองใช้อีเมลแทน" });
  };

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-4">
      {signup ? (
        <RadioGroup
          aria-label="ประเภทบัญชี"
          value={role}
          onChange={(value) => setRole(value as Role)}
          className="flex flex-col gap-2"
        >
          <RadioCard value="tenant" title="ฉันกำลังหาหอพัก" description="ค้นหา แชท และจองห้อง" />
          <RadioCard value="owner" title="ฉันเป็นเจ้าของหอ" description="ลงประกาศและจัดการห้องพัก" />
        </RadioGroup>
      ) : null}

      <AuthCard
        mode={mode}
        title={signup ? "สร้างบัญชี DormDee" : "ยินดีต้อนรับกลับ"}
        description={
          signup ? "สมัครฟรี ใช้เวลาไม่ถึงนาที" : "เข้าสู่ระบบเพื่อแชทและจัดการการจองของคุณ"
        }
        providers={["google"]}
        onSubmit={submit}
        onProvider={continueWithGoogle}
        switchHref={signup ? `/login?next=${encodeURIComponent(next)}` : "/signup"}
      />

      <div aria-live="polite" className="min-h-6 text-center">
        {pending ? <p className="text-body-regular text-text-secondary">กำลังดำเนินการ…</p> : null}
        {result.error ? <p className="text-body-regular text-text-error-primary">{result.error}</p> : null}
        {result.notice ? <p className="text-body-regular text-text-primary">{result.notice}</p> : null}
      </div>
    </div>
  );
}
