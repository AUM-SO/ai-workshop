import { Suspense } from "react";
import { RiCheckLine } from "@remixicon/react";
import { ButtonLink } from "@/components/base/buttons/button";
import { getCurrentProfile } from "@/lib/auth";
import { ComingSoon, LandingSection } from "./section";

const POINTS: { text: string; comingSoon?: boolean }[] = [
  { text: "ลงประกาศฟรี ไม่จำกัดจำนวนห้อง" },
  { text: "ผังห้องรายชั้น เปลี่ยนสถานะได้ในคลิกเดียว" },
  { text: "กล่องแชทรวมผู้สนใจทุกคน พร้อมการ์ดคำขอจอง" },
  { text: "แจ้งเตือนข้อความและคำขอจองผ่าน LINE", comingSoon: true },
  { text: "ป้าย Verified สร้างความน่าเชื่อถือให้หอของคุณ", comingSoon: true },
];

function SignupCta() {
  return (
    <ButtonLink href="/signup?role=owner" data-analytics="landing_owner_cta_click">
      ลงประกาศหอพักฟรี
    </ButtonLink>
  );
}

/** Owners who are already signed in go straight to their dorms. */
async function OwnerCta() {
  const profile = await getCurrentProfile();
  if (profile?.role === "owner") return <ButtonLink href="/owner">ไปที่หอของฉัน</ButtonLink>;
  return <SignupCta />;
}

export function OwnerSection() {
  return (
    <LandingSection id="owners" title="ลงหอพักฟรี จัดการห้องและการจองในที่เดียว">
      <div className="grid gap-8 rounded-3xl border border-border-button-default bg-background-secondary-default p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
        <div className="flex flex-col items-start gap-4">
          <p className="text-title-3-regular text-text-secondary">
            เลิกตอบคำถามเดิมซ้ำ ๆ และจดห้องว่างในสมุด ประกาศของคุณกับผังห้องเป็นข้อมูลชุดเดียวกัน
            ห้องถูกจองเมื่อไร ประกาศก็อัปเดตเอง
          </p>
          {/* The session is a request-time read, so it streams in behind the static page. */}
          <Suspense fallback={<SignupCta />}>
            <OwnerCta />
          </Suspense>
        </div>

        <ul className="flex flex-col gap-3">
          {POINTS.map(({ text, comingSoon }) => (
            <li key={text} className="flex items-start gap-3 text-body-regular text-text-primary">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-status-lime-background">
                <RiCheckLine className="size-3.5 text-status-lime-text" aria-hidden />
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {text}
                {comingSoon ? <ComingSoon /> : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </LandingSection>
  );
}
