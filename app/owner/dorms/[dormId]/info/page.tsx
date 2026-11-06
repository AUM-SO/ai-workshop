import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { DormInfoForm } from "@/components/dorm/dorm-info-form";
import type { DormStep } from "@/app/owner/dorms/actions";
import { getOwnedDorm } from "@/lib/dorms/owner";
import { cx } from "@/utils/cx";

export const metadata: Metadata = { title: "ข้อมูลหอ" };

const STEPS: { key: DormStep; label: string; description: string }[] = [
  { key: "general", label: "ข้อมูลทั่วไป", description: "ชื่อ ประเภทหอ และรายละเอียด" },
  { key: "location", label: "ที่ตั้ง", description: "ที่อยู่และหมุดบนแผนที่ ช่วยให้ผู้เช่าค้นหาหอใกล้ที่เรียนหรือที่ทำงานเจอ" },
  { key: "details", label: "สิ่งอำนวยความสะดวกและกฎ", description: "สิ่งที่หอมีให้ และกฎที่ผู้เช่าต้องรู้ก่อนจอง" },
];

export default function DormInfoPage(props: PageProps<"/owner/dorms/[dormId]/info">) {
  return (
    <Suspense fallback={null}>
      <DormInfo {...props} />
    </Suspense>
  );
}

async function DormInfo({ params, searchParams }: PageProps<"/owner/dorms/[dormId]/info">) {
  const [{ dormId }, { step: rawStep }] = await Promise.all([params, searchParams]);
  const dorm = await getOwnedDorm(dormId);
  const step = STEPS.find((s) => s.key === rawStep) ?? STEPS[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
      <ol aria-label="ขั้นตอนข้อมูลหอ" className="flex gap-2 overflow-x-auto lg:flex-col">
        {STEPS.map((s, index) => (
          <li key={s.key} className="shrink-0">
            <Link
              href={`?step=${s.key}`}
              aria-current={s.key === step.key ? "step" : undefined}
              className={cx(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-body-regular outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring",
                s.key === step.key
                  ? "bg-background-secondary-default text-body-medium text-text-primary"
                  : "text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary",
              )}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-background-tertiary-default text-caption-1-semibold">
                {index + 1}
              </span>
              {s.label}
            </Link>
          </li>
        ))}
      </ol>

      <section
        aria-labelledby="step-title"
        className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-8"
      >
        <div className="flex flex-col gap-1">
          <h2 id="step-title" className="text-title-3-semibold text-text-primary">
            {step.label}
          </h2>
          <p className="text-body-regular text-text-secondary">{step.description}</p>
        </div>
        {/* Keyed by step so switching steps starts a fresh form. */}
        <DormInfoForm key={step.key} dormId={dorm.id} step={step.key} values={dorm} />
      </section>
    </div>
  );
}
