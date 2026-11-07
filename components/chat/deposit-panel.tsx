"use client";

import { useEffect, useId, useState, useTransition } from "react";
import QRCode from "qrcode";
import { RiCheckboxCircleFill, RiFileImageLine, RiQrCodeLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { confirmDeposit, depositSlipUrl, submitDepositSlip } from "@/app/chat/actions";
import { baht } from "@/lib/dorms/costs";
import { maskPromptPay, promptPayPayload } from "@/lib/promptpay";
import { createClient } from "@/lib/supabase/client";

interface DepositPanelProps {
  bookingId: string;
  role: "tenant" | "owner";
  tenantId: string;
  promptpayId: string;
  amount: number;
  submittedAt: string | null;
  confirmedAt: string | null;
}

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

/** PromptPay QR + slip upload for the tenant; slip review for the owner. */
export function DepositPanel({ bookingId, role, tenantId, promptpayId, amount, submittedAt, confirmedAt }: DepositPanelProps) {
  const inputId = useId();
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const showQr = role === "tenant" && !submittedAt;

  useEffect(() => {
    if (!showQr) return;
    // A QR must be dark-on-light for bank apps to scan it, whatever the theme.
    QRCode.toString(promptPayPayload(promptpayId, amount), { type: "svg", margin: 1, color: { dark: "#000000", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setError("สร้าง QR ไม่สำเร็จ"));
  }, [showQr, promptpayId, amount]);

  const run = (fn: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const result = await fn();
      if (result.error) setError(result.error);
    });

  const upload = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPT.includes(file.type)) return setError("แนบรูปสลิปเป็น JPG, PNG หรือ WebP");
    if (file.size > 5 * 1024 * 1024) return setError("รูปสลิปต้องไม่เกิน 5MB");
    run(async () => {
      const path = `${tenantId}/${bookingId}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
      const { error: uploadError } = await createClient().storage.from("deposit-slips").upload(path, file, { contentType: file.type });
      if (uploadError) return { error: "อัปโหลดสลิปไม่สำเร็จ" };
      return submitDepositSlip(bookingId, path);
    });
  };

  const openSlip = () =>
    run(async () => {
      const result = await depositSlipUrl(bookingId);
      if (result.url) window.open(result.url, "_blank", "noopener");
      return result;
    });

  return (
    <div className="flex flex-col gap-3 border-t border-separator-border pt-3">
      <p className="flex items-center gap-2 text-body-medium text-text-primary">
        <RiQrCodeLine className="size-5 text-foreground-icon-secondary" aria-hidden />
        เงินมัดจำ {baht(amount)}
      </p>

      {confirmedAt ? (
        <p className="flex items-center gap-1.5 text-body-medium text-status-lime-text">
          <RiCheckboxCircleFill className="size-5" aria-hidden />
          เจ้าของหอยืนยันว่าได้รับเงินมัดจำแล้ว
        </p>
      ) : submittedAt ? (
        <>
          <p className="text-body-regular text-text-secondary">
            {role === "tenant" ? "แนบสลิปแล้ว รอเจ้าของหอตรวจสอบยอดเงิน" : "ผู้เช่าแนบสลิปแล้ว ตรวจยอดในบัญชีก่อนกดยืนยัน"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="small" variant="secondary" leadingIcon={RiFileImageLine} disabled={pending} onClick={openSlip}>
              ดูสลิป
            </Button>
            {role === "owner" ? (
              <Button size="small" disabled={pending} onClick={() => run(() => confirmDeposit(bookingId))}>
                ยืนยันว่าได้รับเงินแล้ว
              </Button>
            ) : null}
          </div>
        </>
      ) : role === "tenant" ? (
        <>
          <p className="text-body-regular text-text-secondary">
            สแกนจ่ายผ่านแอปธนาคาร ไปที่ PromptPay <span dir="ltr">{maskPromptPay(promptpayId)}</span> แล้วแนบสลิป ควรดูห้องจริงก่อนโอนทุกครั้ง
          </p>
          {qr ? (
            <div
              role="img"
              aria-label={`QR PromptPay ยอด ${baht(amount)}`}
              className="size-44 self-center overflow-hidden rounded-xl border border-border-button-default [&>svg]:size-full"
              dangerouslySetInnerHTML={{ __html: qr }}
            />
          ) : null}
          <label
            htmlFor={inputId}
            className="inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-full bg-accent-600 px-4 py-2 text-body-medium text-text-white outline-none focus-within:ring-2 focus-within:ring-border-focus-ring hover:bg-accent-700"
          >
            <RiFileImageLine className="size-4" aria-hidden />
            {pending ? "กำลังส่ง…" : "แนบสลิป"}
            <input id={inputId} type="file" accept={ACCEPT.join(",")} className="sr-only" disabled={pending} onChange={(e) => upload(e.target.files?.[0])} />
          </label>
        </>
      ) : (
        <p className="text-body-regular text-text-secondary">รอผู้เช่าโอนเงินมัดจำและแนบสลิป</p>
      )}

      {error ? (
        <p role="alert" className="text-caption-1-regular text-text-error-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}
