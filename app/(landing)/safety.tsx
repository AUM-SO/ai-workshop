import type { RemixiconComponentType } from "@remixicon/react";
import { RiAlertLine, RiShieldCheckLine, RiStarLine } from "@remixicon/react";
import { ComingSoon, LandingSection, revealDelay } from "./section";

const TIPS: {
  icon: RemixiconComponentType;
  title: string;
  description: string;
  comingSoon?: boolean;
}[] = [
  {
    icon: RiShieldCheckLine,
    title: "ดูห้องก่อนโอนเงิน",
    description: "อย่าโอนมัดจำก่อนดูห้อง หรือก่อนเจ้าของหอยืนยันการจองในระบบ",
  },
  {
    icon: RiAlertLine,
    title: "เตือนเมื่อมีการขอโอนนอกระบบ",
    description: "ระบบจะเตือนในแชท เมื่อมีการขอให้โอนเงินไปที่อื่น",
    comingSoon: true,
  },
  {
    icon: RiStarLine,
    title: "รีวิวจากผู้เช่าจริง",
    description: "รีวิวได้เฉพาะคนที่จองผ่านระบบแล้วเท่านั้น",
    comingSoon: true,
  },
];

export function Safety() {
  return (
    <LandingSection id="safety" title="เช่าอย่างปลอดภัย">
      <ul className="grid gap-4 md:grid-cols-3">
        {TIPS.map(({ icon: Icon, title, description, comingSoon }, index) => (
          <li key={title} data-reveal style={revealDelay(index)} className="flex gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-6 shadow-sm">
            <Icon className="size-6 shrink-0 text-foreground-icon-primary" aria-hidden />
            <div className="flex flex-col gap-2">
              <h3 className="flex flex-wrap items-center gap-2 text-headline-semibold text-text-primary">
                {title}
                {comingSoon ? <ComingSoon /> : null}
              </h3>
              <p className="text-body-regular text-text-secondary">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
