import { Suspense } from "react";
import type { Metadata } from "next";
import { RiBuilding2Line } from "@remixicon/react";
import { ButtonLink } from "@/components/base/buttons/button";
import { requireProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "หอพักของฉัน" };

export default function OwnerPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12">
      <h1 className="text-title-2-medium text-text-primary">หอพักของฉัน</h1>
      <div className="flex flex-col items-start gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
        <RiBuilding2Line className="size-6 text-foreground-icon-primary" aria-hidden />
        <Suspense fallback={<p className="text-body-regular text-text-secondary">กำลังโหลด…</p>}>
          <OwnerContent />
        </Suspense>
      </div>
    </div>
  );
}

async function OwnerContent() {
  const profile = await requireProfile("/owner");
  const isOwner = profile.role === "owner" || profile.role === "admin";

  if (isOwner) {
    return (
      <>
        <h2 className="text-headline-semibold text-text-primary">เริ่มสร้างหอพักแห่งแรกของคุณ</h2>
        <p className="text-body-regular text-text-secondary">การสร้างหอพักและลงข้อมูลห้องจะเปิดใช้ใน Phase 1</p>
      </>
    );
  }

  return (
    <>
      <h2 className="text-headline-semibold text-text-primary">ลงประกาศหอพักกับ DormDee</h2>
      <p className="text-body-regular text-text-secondary">เปลี่ยนบัญชีเป็นเจ้าของหอเพื่อสร้างหอพักและจัดการห้อง</p>
      <ButtonLink href="/account" variant="secondary">
        เปลี่ยนเป็นบัญชีเจ้าของหอ
      </ButtonLink>
    </>
  );
}
