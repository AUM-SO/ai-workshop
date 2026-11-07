"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { archiveDorm, reviewVerification, setReportStatus } from "@/app/admin/actions";

function useRun() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const result = await fn();
      if (result.error) setError(result.error);
    });
  return { pending, error, run };
}

function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="text-caption-1-regular text-text-error-primary">
      {error}
    </p>
  ) : null;
}

export function VerificationActions({ id }: { id: string }) {
  const { pending, error, run } = useRun();
  const [message, setMessage] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <Input aria-label="เหตุผล (ถ้าไม่อนุมัติ)" placeholder="เหตุผล (ถ้าไม่อนุมัติ)" value={message} onChange={setMessage} size="small" />
      <div className="flex flex-wrap gap-2">
        <Button size="small" disabled={pending} onClick={() => run(() => reviewVerification(id, true, ""))}>
          อนุมัติ
        </Button>
        <Button size="small" variant="secondary" disabled={pending} onClick={() => run(() => reviewVerification(id, false, message))}>
          ไม่อนุมัติ
        </Button>
      </div>
      <ErrorText error={error} />
    </div>
  );
}

export function ReportActions({ id, dormId, dormPublished }: { id: string; dormId: string; dormPublished: boolean }) {
  const { pending, error, run } = useRun();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {dormPublished ? (
          <Button size="small" variant="secondary" disabled={pending} onClick={() => run(() => archiveDorm(dormId))}>
            ปิดประกาศ
          </Button>
        ) : null}
        <Button size="small" disabled={pending} onClick={() => run(() => setReportStatus(id, "resolved"))}>
          จัดการแล้ว
        </Button>
        <Button size="small" variant="ghost" disabled={pending} onClick={() => run(() => setReportStatus(id, "dismissed"))}>
          ไม่ดำเนินการ
        </Button>
      </div>
      <ErrorText error={error} />
    </div>
  );
}
