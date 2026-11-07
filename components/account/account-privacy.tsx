"use client";

import { useState } from "react";
import { RiDeleteBinLine, RiDownload2Line } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { AlertDialog, ModalTrigger } from "@/components/base/modal/modal";
import { deleteAccount } from "@/app/account/actions";

/** PDPA rights: a copy of my data, and deleting the account. */
export function AccountPrivacy({ blockers }: { blockers: string[] }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-headline-semibold text-text-primary">ข้อมูลส่วนบุคคลของฉัน</h2>
        <p className="text-body-regular text-text-secondary">ดาวน์โหลดสำเนาข้อมูลบัญชี หอพัก แชท การจอง และรีวิวของคุณเป็นไฟล์ JSON</p>
        {/* A plain link: the route answers with a file download. */}
        <a
          href="/account/export"
          download
          className="inline-flex items-center gap-2 self-start rounded-full border border-border-button-default px-4 py-2 text-body-medium text-text-primary outline-none transition-colors hover:bg-background-secondary-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring"
        >
          <RiDownload2Line className="size-4" aria-hidden />
          ดาวน์โหลดข้อมูลของฉัน
        </a>
      </div>

      <div className="flex flex-col gap-2 border-t border-separator-border pt-5">
        <h2 className="text-headline-semibold text-text-primary">ลบบัญชี</h2>
        <p className="text-body-regular text-text-secondary">
          ระบบจะลบโปรไฟล์ หอพัก รูปภาพ แชท การจอง รีวิว และการแจ้งเตือนของคุณทั้งหมด กู้คืนไม่ได้ ข้อความที่คุณส่งในแชทของคนอื่นจะถูกลบไปด้วย
          ข้อมูลที่กฎหมายกำหนดให้เก็บ เช่น บันทึกการเข้าใช้งานของระบบ จะเก็บไว้ตามระยะเวลาที่กฎหมายกำหนดแล้วจึงลบ
        </p>
        {blockers.length ? (
          <div className="flex flex-col gap-1 rounded-2xl bg-status-yellow-background px-4 py-3 text-body-regular text-status-yellow-text">
            <p className="text-body-medium">ต้องจัดการก่อนลบบัญชี</p>
            <ul className="list-disc ps-5">
              {blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <ModalTrigger>
          <Button variant="secondary" leadingIcon={RiDeleteBinLine} className="self-start" disabled={blockers.length > 0}>
            ลบบัญชีของฉัน
          </Button>
          <AlertDialog
            title="ลบบัญชีถาวร?"
            description="ข้อมูลทั้งหมดของบัญชีนี้จะถูกลบและกู้คืนไม่ได้ จากนั้นคุณจะออกจากระบบทันที"
            confirmLabel="ลบบัญชี"
            cancelLabel="ยกเลิก"
            pendingLabel="กำลังลบ…"
            onConfirm={async () => {
              setError(null);
              const result = await deleteAccount();
              if (result?.error) {
                setError(result.error);
                throw new Error(result.error);
              }
            }}
          />
        </ModalTrigger>
        {error ? (
          <p role="alert" className="text-body-regular text-text-error-primary">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
