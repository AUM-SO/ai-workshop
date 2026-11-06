"use client";

import { useState, useTransition } from "react";
import { RiDeleteBinLine, RiEyeOffLine, RiSendPlaneLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { AlertDialog, ModalTrigger } from "@/components/base/modal/modal";
import { deleteDorm, setDormStatus } from "@/app/owner/dorms/actions";
import type { DormStatus } from "@/lib/dorms/options";

interface DormStatusActionsProps {
  dormId: string;
  dormName: string;
  status: DormStatus;
  /** Everything the publish guard checks is in place. */
  canPublish: boolean;
}

export function DormStatusActions({ dormId, dormName, status, canPublish }: DormStatusActionsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const changeStatus = (next: "published" | "draft") =>
    startTransition(async () => {
      setError(null);
      const result = await setDormStatus(dormId, next);
      if (result.error) setError(result.error);
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {status === "published" ? (
          <Button variant="secondary" leadingIcon={RiEyeOffLine} disabled={pending} onClick={() => changeStatus("draft")}>
            ปิดประกาศชั่วคราว
          </Button>
        ) : (
          <Button leadingIcon={RiSendPlaneLine} disabled={pending || !canPublish} onClick={() => changeStatus("published")}>
            {pending ? "กำลังเผยแพร่…" : "เผยแพร่หอ"}
          </Button>
        )}

        <ModalTrigger>
          <Button variant="ghost" leadingIcon={RiDeleteBinLine} disabled={pending}>
            ลบหอ
          </Button>
          <AlertDialog
            title={`ลบ ${dormName}?`}
            description="รูป ประเภทห้อง และห้องทั้งหมดของหอนี้จะถูกลบถาวร กู้คืนไม่ได้"
            confirmLabel="ลบหอ"
            cancelLabel="ยกเลิก"
            pendingLabel="กำลังลบ…"
            onConfirm={async () => {
              const result = await deleteDorm(dormId);
              // deleteDorm redirects on success, so a returned value is always an error.
              if (result?.error) {
                setError(result.error);
                throw new Error(result.error);
              }
            }}
          />
        </ModalTrigger>
      </div>
      {!canPublish && status !== "published" ? (
        <p className="text-caption-1-regular text-text-tertiary">ทำรายการด้านบนให้ครบก่อน จึงจะเผยแพร่ได้</p>
      ) : null}
      <p aria-live="polite" className="text-body-regular text-text-error-primary">
        {error}
      </p>
    </div>
  );
}
