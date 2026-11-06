import { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumb, BreadcrumbItem } from "@/components/base/breadcrumb/breadcrumb";
import { DormInfoForm } from "@/components/dorm/dorm-info-form";
import { requireOwner } from "@/lib/dorms/owner";

export const metadata: Metadata = { title: "สร้างหอพัก" };

export default function NewDormPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Breadcrumb aria-label="ตำแหน่งหน้า">
        <BreadcrumbItem href="/owner">หอพักของฉัน</BreadcrumbItem>
        <BreadcrumbItem current>สร้างหอพัก</BreadcrumbItem>
      </Breadcrumb>
      <div className="flex flex-col gap-2">
        <h1 className="text-title-1-semibold text-text-primary">สร้างหอพัก</h1>
        <p className="text-body-regular text-text-secondary">
          เริ่มจากข้อมูลทั่วไป ระบบจะบันทึกเป็นแบบร่างไว้ คุณกลับมาแก้และเผยแพร่ทีหลังได้
        </p>
      </div>
      <StepIndicator />
      <div className="rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-8">
        {/* The session is request data, so the guard streams in. */}
        <Suspense fallback={null}>
          <GuardedForm />
        </Suspense>
      </div>
    </div>
  );
}

async function GuardedForm() {
  await requireOwner("/owner/dorms/new");
  return <DormInfoForm step="general" />;
}

function StepIndicator() {
  const steps = ["ข้อมูลทั่วไป", "ที่ตั้ง", "สิ่งอำนวยความสะดวก", "รูปภาพ", "ห้องพัก"];
  return (
    <ol className="flex flex-wrap gap-2" aria-label="ขั้นตอนการสร้างหอ">
      {steps.map((label, index) => (
        <li
          key={label}
          aria-current={index === 0 ? "step" : undefined}
          className={
            index === 0
              ? "rounded-full bg-status-blue-background px-3 py-1 text-caption-1-medium text-status-blue-text"
              : "rounded-full bg-background-tertiary-default px-3 py-1 text-caption-1-medium text-text-tertiary"
          }
        >
          {index + 1}. {label}
        </li>
      ))}
    </ol>
  );
}
