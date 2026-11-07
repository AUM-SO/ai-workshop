import type { RemixiconComponentType } from "@remixicon/react";
import {
  RiChat3Line,
  RiGroupLine,
  RiLayoutGridLine,
  RiNotification3Line,
  RiRouteLine,
  RiWallet3Line,
} from "@remixicon/react";
import { MoveInCostDemo } from "./move-in-cost-demo";
import { ComingSoon, LandingSection, revealDelay } from "./section";

interface Feature {
  icon: RemixiconComponentType;
  title: string;
  description: string;
  comingSoon?: boolean;
}

const FEATURES: Feature[] = [
  {
    icon: RiLayoutGridLine,
    title: "ห้องว่างจริง",
    description: "ดูผังห้องรายชั้น รู้ทันทีว่าห้องไหนว่าง ติดจอง หรือมีคนอยู่แล้ว",
  },
  {
    icon: RiChat3Line,
    title: "จองผ่านแชท",
    description: "คุยกับเจ้าของหอ แล้วส่งคำขอจองพร้อมวันเข้าอยู่ได้ในแชทเดียว",
  },
  {
    icon: RiWallet3Line,
    title: "คำนวณค่าเข้าอยู่",
    description: "เห็นเงินที่ต้องเตรียมวันเข้าอยู่ ทั้งค่าเช่าล่วงหน้าและมัดจำ",
  },
  {
    icon: RiNotification3Line,
    title: "แจ้งเตือนเมื่อห้องว่าง",
    description: "กดติดตามห้องที่ชอบ แล้วรับแจ้งเตือนทันทีที่มีห้องว่าง",
  },
  {
    icon: RiRouteLine,
    title: "ค้นหาตามเวลาเดินทาง",
    description: "ใส่ที่เรียนหรือที่ทำงาน แล้วกรองหอที่เดินทางไม่เกินกี่นาที",
  },
  {
    icon: RiGroupLine,
    title: "หาเพื่อนร่วมห้อง",
    description: "จับคู่รูมเมทจากไลฟ์สไตล์ เวลานอน และนิสัยการใช้ห้อง",
  },
];

export function TenantFeatures() {
  return (
    <LandingSection
      id="features"
      title="ทุกอย่างที่ต้องรู้ ก่อนตัดสินใจเช่า"
      description="ไม่ต้องทักถามทีละหอ ข้อมูลที่ใช้ตัดสินใจอยู่ในหน้าเดียว"
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description, comingSoon }, index) => (
          // The reveal animates the <li>; the hover lift lives on the card inside, so the two never fight.
          <li key={title} data-reveal style={revealDelay(index)}>
            <div className="group flex h-full flex-col gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-6 shadow-sm transition-[translate,box-shadow,border-color] duration-300 ease-out hover:border-border-button-hover hover:shadow-lg motion-safe:hover:-translate-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="flex size-10 items-center justify-center rounded-xl bg-background-secondary-default transition-[scale,background-color] duration-300 ease-out group-hover:bg-background-secondary-hover motion-safe:group-hover:scale-110">
                  <Icon className="size-5 text-foreground-icon-primary" aria-hidden />
                </span>
                {comingSoon ? <ComingSoon /> : null}
              </div>
              <h3 className="text-headline-semibold text-text-primary">{title}</h3>
              <p className="text-body-regular text-text-secondary">{description}</p>
            </div>
          </li>
        ))}
      </ul>

      <div data-reveal className="grid items-center gap-6 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
        <div className="flex flex-col gap-2">
          <h3 className="text-title-2-semibold text-text-primary">ลองคำนวณค่าเข้าอยู่</h3>
          <p className="text-body-regular text-text-secondary">
            หอส่วนใหญ่เก็บค่าเช่าล่วงหน้าและเงินมัดจำรวมกันหลายเดือน ลองใส่ตัวเลขของหอที่สนใจดู
          </p>
        </div>
        <MoveInCostDemo />
      </div>
    </LandingSection>
  );
}
