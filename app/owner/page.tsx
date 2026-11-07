import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RiAddLine, RiBuilding2Line, RiChat3Line, RiImageLine } from "@remixicon/react";
import { ButtonLink } from "@/components/base/buttons/button";
import { DormStatusChip } from "@/components/dorm/dorm-status-chip";
import { ROOM_STATUS_LABEL, ROOM_STATUS_STYLE } from "@/components/dorm/room-grid";
import { requireProfile } from "@/lib/auth";
import { ROOM_STATUSES, type RoomStatus } from "@/lib/dorms/options";
import { createClient } from "@/lib/supabase/server";
import { cx } from "@/utils/cx";

export const metadata: Metadata = { title: "หอพักของฉัน" };

export default function OwnerPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <Suspense fallback={<p className="text-body-regular text-text-secondary">กำลังโหลด…</p>}>
        <OwnerContent />
      </Suspense>
    </div>
  );
}

async function OwnerContent() {
  const profile = await requireProfile("/owner");
  if (profile.role !== "owner" && profile.role !== "admin") return <TenantNotice />;

  const supabase = await createClient();
  const { data } = await supabase
    .from("dorms")
    .select("id, name, status, district, province, cover_url, updated_at, rooms(status)")
    .eq("owner_id", profile.id)
    .order("updated_at", { ascending: false });
  const dorms = (data ?? []).map(({ rooms, ...dorm }) => ({
    ...dorm,
    counts: Object.fromEntries(ROOM_STATUSES.map((s) => [s, rooms.filter((r) => r.status === s).length])) as Record<
      RoomStatus,
      number
    >,
    total: rooms.length,
  }));

  if (dorms.length === 0) return <FirstDormGuide />;

  const totals = Object.fromEntries(
    ROOM_STATUSES.map((s) => [s, dorms.reduce((sum, d) => sum + d.counts[s], 0)]),
  ) as Record<RoomStatus, number>;
  const allRooms = dorms.reduce((sum, d) => sum + d.total, 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title-1-semibold text-text-primary">หอพักของฉัน</h1>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/chat" variant="secondary" leadingIcon={RiChat3Line}>
            แชทและคำขอจอง
          </ButtonLink>
          <ButtonLink href="/owner/dorms/new" leadingIcon={RiAddLine}>
            สร้างหอพัก
          </ButtonLink>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="ห้องทั้งหมดของทุกหอ">
        {(["vacant", "held", "occupied", "maintenance"] as const).map((status) => (
          <div key={status} className="flex flex-col gap-1 rounded-2xl border border-border-button-default bg-background-primary-default p-4">
            <dt className="flex items-center gap-1.5 text-body-regular text-text-secondary">
              <span aria-hidden className={cx("size-3 rounded-sm", ROOM_STATUS_STYLE[status])} />
              {ROOM_STATUS_LABEL[status]}
            </dt>
            <dd className="text-title-1-semibold text-text-primary tabular-nums">
              {totals[status]}
              <span className="text-body-regular text-text-tertiary"> / {allRooms}</span>
            </dd>
          </div>
        ))}
      </dl>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dorms.map((dorm) => (
          <li key={dorm.id}>
            <Link
              href={`/owner/dorms/${dorm.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default outline-none transition-[border-color,box-shadow] hover:border-border-button-hover hover:shadow-sm focus-visible:ring-2 focus-visible:ring-border-focus-ring"
            >
              <div className="relative aspect-[16/9] bg-background-tertiary-default">
                {dorm.cover_url ? (
                  <Image src={dorm.cover_url} alt="" fill unoptimized sizes="(min-width: 1024px) 360px, 50vw" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-foreground-icon-quaternary">
                    <RiImageLine className="size-8" aria-hidden />
                  </span>
                )}
                <span className="absolute start-3 top-3">
                  <DormStatusChip status={dorm.status} />
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-headline-semibold text-text-primary group-hover:underline">{dorm.name}</span>
                  <span className="text-caption-1-regular text-text-tertiary">
                    {[dorm.district, dorm.province].filter(Boolean).join(", ") || "ยังไม่ได้กรอกที่อยู่"}
                  </span>
                </div>
                <OccupancyBar counts={dorm.counts} total={dorm.total} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

/** A stacked bar of room statuses, with the vacant count spelled out. */
function OccupancyBar({ counts, total }: { counts: Record<RoomStatus, number>; total: number }) {
  if (total === 0) return <p className="text-body-regular text-text-secondary">ยังไม่มีห้อง</p>;
  return (
    <div className="flex flex-col gap-1.5">
      <div aria-hidden className="flex h-2 overflow-hidden rounded-full bg-background-tertiary-default">
        {ROOM_STATUSES.map((status) =>
          counts[status] ? (
            <span key={status} className={ROOM_STATUS_STYLE[status]} style={{ width: `${(counts[status] / total) * 100}%` }} />
          ) : null,
        )}
      </div>
      <p className="text-body-regular text-text-secondary">
        ว่าง <span className="text-body-medium text-text-primary tabular-nums">{counts.vacant}</span> จาก {total} ห้อง
        {counts.held ? ` · ติดจอง ${counts.held}` : ""}
      </p>
    </div>
  );
}

function FirstDormGuide() {
  const steps = [
    { title: "ข้อมูลหอและที่ตั้ง", detail: "ชื่อหอ ประเภท (ชาย/หญิง/รวม) ที่อยู่ และหมุดบนแผนที่" },
    { title: "รูปภาพ", detail: "ด้านหน้าอาคาร ห้องพัก ห้องน้ำ และส่วนกลาง อย่างน้อย 1 รูป" },
    { title: "ประเภทห้องและราคา", detail: "ค่าเช่า เงินมัดจำ ค่าเช่าล่วงหน้า ค่าน้ำค่าไฟ และค่าใช้จ่ายอื่น" },
    { title: "เลขห้อง", detail: "เพิ่มทีละชั้น เช่น 201–210 แล้วตั้งสถานะห้องที่มีคนอยู่แล้ว" },
  ];

  return (
    <section
      aria-labelledby="first-dorm-title"
      className="flex flex-col gap-6 rounded-3xl border border-border-button-default bg-background-primary-default p-6 sm:p-10"
    >
      <RiBuilding2Line className="size-8 text-foreground-icon-primary" aria-hidden />
      <div className="flex flex-col gap-2">
        <h1 id="first-dorm-title" className="text-title-1-semibold text-text-primary">
          ลงประกาศหอพักแห่งแรกของคุณ
        </h1>
        <p className="max-w-2xl text-body-regular text-text-secondary">
          ใช้เวลาประมาณ 10 นาที ระบบบันทึกเป็นแบบร่างไว้ทุกขั้น คุณจะเผยแพร่เมื่อพร้อม เตรียมข้อมูลเหล่านี้ไว้
        </p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3 rounded-2xl bg-background-secondary-default p-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background-primary-default text-body-semibold text-text-primary">
              {index + 1}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-body-medium text-text-primary">{step.title}</span>
              <span className="text-body-regular text-text-secondary">{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>
      <ButtonLink href="/owner/dorms/new" leadingIcon={RiAddLine} className="self-start">
        เริ่มสร้างหอพัก
      </ButtonLink>
    </section>
  );
}

function TenantNotice() {
  return (
    <section className="flex flex-col items-start gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-6 sm:p-10">
      <RiBuilding2Line className="size-8 text-foreground-icon-primary" aria-hidden />
      <h1 className="text-title-2-semibold text-text-primary">ลงประกาศหอพักกับ DormDee</h1>
      <p className="text-body-regular text-text-secondary">
        บัญชีของคุณเป็นบัญชีผู้เช่า เปลี่ยนเป็นบัญชีเจ้าของหอก่อน จึงจะสร้างหอพักและจัดการห้องได้
      </p>
      <ButtonLink href="/account" variant="secondary">
        เปลี่ยนเป็นบัญชีเจ้าของหอ
      </ButtonLink>
    </section>
  );
}
