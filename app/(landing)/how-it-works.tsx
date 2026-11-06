"use client";

import { use, useState } from "react";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";

type Audience = "tenant" | "owner";

const STEPS: Record<Audience, { title: string; description: string }[]> = {
  tenant: [
    { title: "ค้นหาหอ", description: "ค้นหาหอใกล้ที่เรียนหรือที่ทำงาน กรองตามราคาและประเภทหอ" },
    { title: "ดูห้องว่างจริง", description: "ดูผังห้องที่ว่างจริง และค่าใช้จ่ายทั้งหมดก่อนตัดสินใจ" },
    { title: "แชทเพื่อจอง", description: "ส่งคำขอจองในแชท แล้วรอเจ้าของหอยืนยัน" },
  ],
  owner: [
    { title: "สร้างหอ", description: "สมัครแล้วสร้างหอ ใส่รูป ที่ตั้ง และสิ่งอำนวยความสะดวก" },
    { title: "เพิ่มห้อง", description: "เพิ่มประเภทห้องและเลขห้อง ระบบสร้างผังห้องให้อัตโนมัติ" },
    { title: "รับจองในแชท", description: "ตอบแชทและกดยืนยันการจอง สถานะห้องอัปเดตเอง" },
  ],
};

/** Reads `?for=owner` so the header's owner link opens the owner steps. Suspends; wrap in `<Suspense>`. */
export function HowItWorksFromUrl({ searchParams }: { searchParams: Promise<{ for?: string | string[] }> }) {
  const { for: audience } = use(searchParams);
  return <HowItWorks initial={audience === "owner" ? "owner" : "tenant"} />;
}

export function HowItWorks({ initial = "tenant" }: { initial?: Audience }) {
  const [audience, setAudience] = useState<Audience>(initial);

  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl
        aria-label="แสดงขั้นตอนสำหรับ"
        selectedKeys={[audience]}
        onSelectionChange={(keys) => {
          const [next] = [...keys];
          if (next) setAudience(next as Audience);
        }}
        className="self-start"
        data-analytics="landing_how_it_works_tab"
      >
        <SegmentedControlItem id="tenant">ผู้เช่า</SegmentedControlItem>
        <SegmentedControlItem id="owner">เจ้าของหอ</SegmentedControlItem>
      </SegmentedControl>

      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS[audience].map(({ title, description }, index) => (
          <li
            key={title}
            className="flex flex-col gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-6"
          >
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-full bg-background-tertiary-default text-body-semibold text-text-primary"
            >
              {index + 1}
            </span>
            <h3 className="text-headline-semibold text-text-primary">
              <span className="sr-only">ขั้นที่ {index + 1}: </span>
              {title}
            </h3>
            <p className="text-body-regular text-text-secondary">{description}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
