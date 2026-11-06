import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { RiArrowRightSLine, RiCheckboxCircleFill, RiCheckboxBlankCircleLine } from "@remixicon/react";
import { DormStatusActions } from "@/components/dorm/dorm-status-actions";
import { getOwnedDorm } from "@/lib/dorms/owner";
import { createClient } from "@/lib/supabase/server";
import { cx } from "@/utils/cx";

export const metadata: Metadata = { title: "จัดการหอ" };

export default function DormOverviewPage(props: PageProps<"/owner/dorms/[dormId]">) {
  return (
    <Suspense fallback={null}>
      <DormOverview {...props} />
    </Suspense>
  );
}

async function DormOverview({ params }: PageProps<"/owner/dorms/[dormId]">) {
  const { dormId } = await params;
  const dorm = await getOwnedDorm(dormId);
  const supabase = await createClient();

  const [photos, roomTypes, rooms] = await Promise.all([
    supabase.from("dorm_photos").select("id", { count: "exact", head: true }).eq("dorm_id", dorm.id),
    supabase.from("room_types").select("id", { count: "exact", head: true }).eq("dorm_id", dorm.id),
    supabase.from("rooms").select("status").eq("dorm_id", dorm.id),
  ]);
  const roomList = rooms.data ?? [];
  const vacant = roomList.filter((r) => r.status === "vacant").length;

  const base = `/owner/dorms/${dorm.id}`;
  const checklist = [
    { done: true, required: true, label: "ข้อมูลทั่วไป", detail: "ชื่อและประเภทหอ", href: `${base}/info?step=general` },
    {
      done: Boolean(dorm.address && dorm.province),
      required: true,
      label: "ที่อยู่และจังหวัด",
      detail: dorm.lat != null ? "ปักหมุดแผนที่แล้ว" : "แนะนำให้ปักหมุดแผนที่ด้วย",
      href: `${base}/info?step=location`,
    },
    {
      done: dorm.amenities.length > 0,
      required: false,
      label: "สิ่งอำนวยความสะดวกและกฎ",
      detail: dorm.amenities.length ? `${dorm.amenities.length} รายการ` : "ไม่บังคับ แต่ช่วยให้ผู้เช่าตัดสินใจง่ายขึ้น",
      href: `${base}/info?step=details`,
    },
    {
      done: (photos.count ?? 0) > 0,
      required: true,
      label: "รูปภาพ",
      detail: photos.count ? `${photos.count} รูป` : "อย่างน้อย 1 รูป",
      href: `${base}/photos`,
    },
    {
      done: (roomTypes.count ?? 0) > 0,
      required: true,
      label: "ประเภทห้องและราคา",
      detail: roomTypes.count ? `${roomTypes.count} ประเภท` : "อย่างน้อย 1 ประเภท",
      href: `${base}/room-types`,
    },
    {
      done: roomList.length > 0,
      required: true,
      label: "ห้องพัก",
      detail: roomList.length ? `${roomList.length} ห้อง ว่าง ${vacant} ห้อง` : "อย่างน้อย 1 ห้อง",
      href: `${base}/rooms`,
    },
  ];
  const canPublish = checklist.every((item) => item.done || !item.required);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section
        aria-labelledby="checklist-title"
        className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6"
      >
        <h2 id="checklist-title" className="text-title-3-semibold text-text-primary">
          ความพร้อมของประกาศ
        </h2>
        <ul className="flex flex-col divide-y divide-separator-border">
          {checklist.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="group flex items-center gap-3 rounded-xl py-3 outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
              >
                {item.done ? (
                  <RiCheckboxCircleFill className="size-5 shrink-0 text-status-lime-text" aria-label="เสร็จแล้ว" />
                ) : (
                  <RiCheckboxBlankCircleLine className="size-5 shrink-0 text-foreground-icon-quaternary" aria-label="ยังไม่เสร็จ" />
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-body-medium text-text-primary">
                    {item.label}
                    {item.required ? null : <span className="text-text-tertiary"> (ไม่บังคับ)</span>}
                  </span>
                  <span className={cx("text-caption-1-regular", item.done ? "text-text-tertiary" : "text-text-secondary")}>
                    {item.detail}
                  </span>
                </span>
                <RiArrowRightSLine
                  className="size-5 shrink-0 text-foreground-icon-tertiary transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="publish-title"
        className="flex flex-col gap-4 self-start rounded-3xl border border-border-button-default bg-background-secondary-default p-5 sm:p-6"
      >
        <h2 id="publish-title" className="text-title-3-semibold text-text-primary">
          การเผยแพร่
        </h2>
        <p className="text-body-regular text-text-secondary">
          {dorm.status === "published"
            ? "ผู้เช่าค้นหาและเห็นหอนี้ได้แล้ว ปิดประกาศชั่วคราวได้ทุกเมื่อ"
            : "หอนี้ยังเป็นแบบร่าง มีแค่คุณที่เห็น"}
        </p>
        <DormStatusActions dormId={dorm.id} dormName={dorm.name} status={dorm.status} canPublish={canPublish} />
      </section>
    </div>
  );
}
