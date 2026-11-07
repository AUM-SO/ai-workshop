"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RiFileUploadLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Textarea } from "@/components/base/textarea/textarea";
import { requestVerification } from "@/app/owner/verify/actions";
import { createClient } from "@/lib/supabase/client";
import { useHydrated } from "@/lib/use-hydrated";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024;

export function VerificationForm({ userId }: { userId: string }) {
  const router = useRouter();
  const inputId = useId();
  const hydrated = useHydrated();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pick = (picked: File | undefined) => {
    setError(null);
    if (!picked) return setFile(null);
    if (!ACCEPT.includes(picked.type)) return setError("รองรับ JPG, PNG, WebP หรือ PDF เท่านั้น");
    if (picked.size > MAX_BYTES) return setError("ไฟล์ต้องไม่เกิน 5MB");
    setFile(picked);
  };

  const submit = () =>
    startTransition(async () => {
      if (!file) return;
      setError(null);
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await createClient()
        .storage.from("verification-docs")
        .upload(path, file, { contentType: file.type });
      if (uploadError) return setError("อัปโหลดไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง");
      const result = await requestVerification(path, note);
      if (result.error) return setError(result.error);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <label
        htmlFor={inputId}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-border-button-default bg-background-secondary-default px-6 py-8 text-center transition-colors focus-within:ring-2 focus-within:ring-border-focus-ring hover:bg-background-secondary-hover"
      >
        <RiFileUploadLine className="size-8 text-foreground-icon-secondary" aria-hidden />
        <span className="text-body-medium text-text-primary">{file ? file.name : "เลือกไฟล์เอกสาร"}</span>
        <span className="text-caption-1-regular text-text-tertiary">
          โฉนด สัญญาเช่า ใบอนุญาตประกอบกิจการหอพัก หรือบัตรประชาชนคู่กับเอกสารที่อยู่ของหอ · JPG, PNG, WebP, PDF ไม่เกิน 5MB
        </span>
        <input id={inputId} type="file" accept={ACCEPT.join(",")} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      </label>
      <Textarea label="หมายเหตุถึงทีมงาน (ถ้ามี)" value={note} onChange={setNote} rows={2} maxLength={500} />
      {error ? (
        <p role="alert" className="text-body-regular text-text-error-primary">
          {error}
        </p>
      ) : null}
      <Button className="self-start" disabled={!hydrated || !file || pending} onClick={submit}>
        {pending ? "กำลังส่ง…" : "ส่งให้ทีมงานตรวจสอบ"}
      </Button>
    </div>
  );
}
