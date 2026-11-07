"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { requestPasswordReset, updatePassword, type AuthResult } from "@/app/(auth)/actions";
import { useHydrated } from "@/lib/use-hydrated";

function useAuthAction(action: (data: FormData) => Promise<AuthResult>, initial: AuthResult = {}) {
  const [result, setResult] = useState<AuthResult>(initial);
  const [pending, startTransition] = useTransition();
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setResult({});
    // A successful updatePassword redirects, so only failures and notices come back.
    startTransition(async () => setResult((await action(data)) ?? {}));
  };
  return { result, pending, onSubmit };
}

function Messages({ result }: { result: AuthResult }) {
  return (
    <div aria-live="polite">
      {result.error ? <p className="text-body-regular text-text-error-primary">{result.error}</p> : null}
      {result.notice ? <p className="text-body-regular text-text-primary">{result.notice}</p> : null}
    </div>
  );
}

export function ForgotPasswordForm({ initialError }: { initialError?: string }) {
  const { result, pending, onSubmit } = useAuthAction(requestPasswordReset, initialError ? { error: initialError } : {});
  const hydrated = useHydrated();
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input name="email" type="email" label="อีเมล" placeholder="you@example.com" autoComplete="email" isRequired />
      <Button type="submit" className="w-full" disabled={!hydrated || pending}>
        {pending ? "กำลังส่ง…" : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}
      </Button>
      <Messages result={result} />
    </form>
  );
}

export function ResetPasswordForm() {
  const { result, pending, onSubmit } = useAuthAction(updatePassword);
  const hydrated = useHydrated();
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        name="password"
        type="password"
        label="รหัสผ่านใหม่"
        placeholder="อย่างน้อย 8 ตัวอักษร"
        autoComplete="new-password"
        minLength={8}
        isRequired
      />
      <Button type="submit" className="w-full" disabled={!hydrated || pending}>
        {pending ? "กำลังบันทึก…" : "ตั้งรหัสผ่านใหม่"}
      </Button>
      <Messages result={result} />
    </form>
  );
}
