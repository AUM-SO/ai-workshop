import { Suspense } from "react";
import type { Metadata } from "next";
import { RiShieldCheckLine, RiTimeLine, RiVerifiedBadgeFill } from "@remixicon/react";
import { ButtonLink } from "@/components/base/buttons/button";
import { VerificationForm } from "@/components/dorm/verification-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "ยืนยันตัวตนเจ้าของหอ" };

const dateFormat = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" });

export default function OwnerVerifyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-title-1-semibold text-text-primary">ยืนยันตัวตนเจ้าของหอ</h1>
        <p className="text-body-regular text-text-secondary">
          ส่งเอกสารที่แสดงว่าคุณเป็นเจ้าของหรือผู้มีสิทธิ์ปล่อยเช่า เมื่อทีมงานอนุมัติ ทุกหอของคุณจะแสดงป้าย Verified
          เอกสารเก็บแบบส่วนตัว เห็นได้เฉพาะคุณและทีมงาน
        </p>
      </div>
      <div className="rounded-3xl border border-border-button-default bg-background-primary-default p-6 shadow-sm">
        <Suspense fallback={<p className="text-body-regular text-text-secondary">กำลังโหลด…</p>}>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}

async function VerifyContent() {
  const profile = await requireProfile("/owner/verify");
  if (profile.role === "tenant") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-body-regular text-text-secondary">หน้านี้สำหรับเจ้าของหอ เปลี่ยนบัญชีเป็นเจ้าของหอได้ที่หน้าบัญชี</p>
        <ButtonLink href="/account" variant="secondary">
          ไปหน้าบัญชี
        </ButtonLink>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: me }, { data: latest }] = await Promise.all([
    supabase.from("profiles").select("verified_at").eq("id", profile.id).single(),
    supabase
      .from("owner_verifications")
      .select("status, reviewer_note, created_at")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (me?.verified_at) {
    return (
      <p className="flex items-center gap-2 text-headline-semibold text-text-primary">
        <RiVerifiedBadgeFill className="size-6 text-accent-600" aria-hidden />
        ยืนยันตัวตนแล้วเมื่อ {dateFormat.format(new Date(me.verified_at))}
      </p>
    );
  }

  if (latest?.status === "pending") {
    return (
      <p className="flex items-start gap-2 text-body-regular text-text-primary">
        <RiTimeLine className="mt-0.5 size-5 shrink-0 text-foreground-icon-secondary" aria-hidden />
        ส่งเอกสารแล้วเมื่อ {dateFormat.format(new Date(latest.created_at))} ทีมงานกำลังตรวจสอบ ปกติใช้เวลาไม่เกิน 2 วันทำการ
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {latest?.status === "rejected" ? (
        <p role="status" className="rounded-2xl bg-status-rose-background px-4 py-3 text-body-regular text-status-rose-text">
          คำขอล่าสุดไม่ผ่าน{latest.reviewer_note ? `: ${latest.reviewer_note}` : ""} กรุณาส่งเอกสารใหม่
        </p>
      ) : (
        <p className="flex items-center gap-2 text-body-medium text-text-primary">
          <RiShieldCheckLine className="size-5 text-foreground-icon-secondary" aria-hidden />
          ยังไม่ได้ยืนยันตัวตน
        </p>
      )}
      <VerificationForm userId={profile.id} />
    </div>
  );
}
