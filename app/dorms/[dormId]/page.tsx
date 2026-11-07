import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  RiCheckLine,
  RiExternalLinkLine,
  RiMapPin2Line,
  RiShieldCheckLine,
  RiUser3Line,
  RiVerifiedBadgeFill,
} from "@remixicon/react";
import { Breadcrumb, BreadcrumbItem } from "@/components/base/breadcrumb/breadcrumb";
import { Chip } from "@/components/base/badges/chip";
import { ChatUnavailableNotice, StartChatButton } from "@/components/chat/start-chat-button";
import { LocationMap } from "@/components/dorm/location-map";
import { MoveInCostCalculator } from "@/components/dorm/move-in-cost-calculator";
import { Stars } from "@/components/dorm/stars";
import { LiveRoomMap } from "@/components/dorm/live-room-map";
import { baht } from "@/lib/dorms/costs";
import { AMENITIES, GENDER_POLICY_LABEL } from "@/lib/dorms/options";
import { getPublicDorm, type PublicDorm } from "@/lib/dorms/public";
import { Gallery } from "./gallery";
import { DormJsonLd } from "./json-ld";
import { RoomTypeCard } from "./room-type-card";
import { ReportSlot, ReviewComposer } from "./trust-slots";

const amenityLabel = new Map<string, string>(AMENITIES.map((a) => [a.key, a.label]));
const reviewDate = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" });

export async function generateMetadata({ params }: PageProps<"/dorms/[dormId]">): Promise<Metadata> {
  const { dormId } = await params;
  const data = await getPublicDorm(dormId);
  if (!data) return { title: "ไม่พบหอพัก" };
  const { dorm, roomTypes } = data;
  const from = roomTypes[0]?.monthly_price;
  const place = [dorm.district, dorm.province].filter(Boolean).join(", ");
  return {
    title: dorm.name,
    description: [
      `${dorm.name} ${GENDER_POLICY_LABEL[dorm.gender_policy]} ${place}`,
      from ? `ค่าเช่าเริ่มต้น ${baht(from)}/เดือน` : null,
      dorm.description?.slice(0, 120),
    ]
      .filter(Boolean)
      .join(" · "),
    alternates: { canonical: `/dorms/${dorm.id}` },
    openGraph: {
      type: "website",
      locale: "th_TH",
      siteName: "DormDee",
      title: `${dorm.name} | DormDee`,
      url: `/dorms/${dorm.id}`,
      images: dorm.cover_url ? [{ url: dorm.cover_url, alt: dorm.name }] : undefined,
    },
  };
}

export default function DormPage(props: PageProps<"/dorms/[dormId]">) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:py-10">
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <DormContent {...props} />
      </Suspense>
    </div>
  );
}

async function DormContent({ params, searchParams }: PageProps<"/dorms/[dormId]">) {
  const { dormId } = await params;
  const data = await getPublicDorm(dormId);
  if (!data) notFound();
  return (
    <>
      <DormJsonLd data={data} />
      <DormView data={data} searchParams={searchParams} />
    </>
  );
}

function DormView({ data, searchParams }: { data: PublicDorm; searchParams: PageProps<"/dorms/[dormId]">["searchParams"] }) {
  const { dorm, photos, roomTypes, rooms, owner, reviews, rating } = data;
  const vacantByType = new Map<string, number>();
  for (const room of rooms) {
    if (room.status === "vacant") vacantByType.set(room.room_type_id, (vacantByType.get(room.room_type_id) ?? 0) + 1);
  }
  const vacant = rooms.filter((r) => r.status === "vacant").length;
  const from = roomTypes[0]?.monthly_price;
  const place = [dorm.district, dorm.province].filter(Boolean).join(", ");

  return (
    <>
      <Breadcrumb aria-label="ตำแหน่งหน้า">
        <BreadcrumbItem href="/search">ค้นหาหอพัก</BreadcrumbItem>
        {dorm.province ? (
          <BreadcrumbItem href={`/search?province=${encodeURIComponent(dorm.province)}`}>{dorm.province}</BreadcrumbItem>
        ) : null}
        <BreadcrumbItem current>{dorm.name}</BreadcrumbItem>
      </Breadcrumb>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-8">
          <Gallery name={dorm.name} photos={photos} />

          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Chip color="blue" variant="caption">
                {GENDER_POLICY_LABEL[dorm.gender_policy]}
              </Chip>
              <Chip color={vacant > 0 ? "lime" : "neutral"} variant="caption">
                {vacant > 0 ? `ว่าง ${vacant} ห้อง` : "ห้องเต็ม"}
              </Chip>
            </div>
            <h1 className="text-title-1-semibold text-text-primary sm:text-display-4-semibold">{dorm.name}</h1>
            {rating != null ? (
              <a href="#reviews" className="flex items-center gap-2 self-start rounded-md text-body-medium text-text-secondary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-border-focus-ring">
                <Stars value={rating} />
                <span className="tabular-nums">{rating.toFixed(1)}</span>
                <span>({reviews.length} รีวิว)</span>
              </a>
            ) : null}
            <p className="flex items-start gap-1.5 text-body-regular text-text-secondary">
              <RiMapPin2Line className="mt-0.5 size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
              {[dorm.address, place].filter(Boolean).join(" ")}
            </p>
          </header>

          {dorm.description ? (
            <Section id="about" title="รายละเอียด">
              <p className="text-body-regular whitespace-pre-line text-text-primary">{dorm.description}</p>
            </Section>
          ) : null}

          <Section id="room-types" title="ประเภทห้องและราคา">
            <div className="grid gap-4 md:grid-cols-2">
              {roomTypes.map((type) => (
                <RoomTypeCard key={type.id} dormId={dorm.id} type={type} vacant={vacantByType.get(type.id) ?? 0} />
              ))}
            </div>
          </Section>

          {roomTypes.length ? (
            <Section id="costs" title="คำนวณค่าใช้จ่าย" description="เงินที่ต้องเตรียมวันเข้าอยู่ และค่าใช้จ่ายรายเดือนรวมค่าน้ำค่าไฟ">
              <MoveInCostCalculator roomTypes={roomTypes} />
            </Section>
          ) : null}

          <Section
            id="room-map"
            title="ผังห้อง"
            description="สถานะห้องมาจากระบบที่เจ้าของหอใช้จัดการหอโดยตรง"
          >
            <div className="rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-sm">
              <LiveRoomMap dormId={dorm.id} dormName={dorm.name} initialRooms={rooms} />
            </div>
          </Section>

          {dorm.amenities.length ? (
            <Section id="amenities" title="สิ่งอำนวยความสะดวก">
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {dorm.amenities.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-body-regular text-text-primary">
                    <RiCheckLine className="size-4 text-status-lime-text" aria-hidden />
                    {amenityLabel.get(key) ?? key}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {dorm.rules ? (
            <Section id="rules" title="กฎของหอ">
              <p className="text-body-regular whitespace-pre-line text-text-primary">{dorm.rules}</p>
            </Section>
          ) : null}

          <Section id="reviews" title="รีวิวจากผู้เช่า" description="รีวิวได้เฉพาะคนที่จองห้องผ่าน DormDee และเจ้าของหอยืนยันแล้ว">
            <Suspense fallback={null}>
              <ReviewComposer dormId={dorm.id} />
            </Suspense>
            {reviews.length ? (
              <ul className="flex flex-col gap-3">
                {reviews.map((review) => (
                  <li key={review.id} className="flex flex-col gap-2 rounded-3xl border border-border-button-default bg-background-primary-default p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-body-medium text-text-primary">{review.tenantName}</span>
                      <span className="text-caption-1-regular text-text-tertiary">{reviewDate.format(new Date(review.created_at))}</span>
                    </div>
                    <Stars value={review.rating} />
                    {review.body ? <p className="text-body-regular whitespace-pre-line text-text-primary">{review.body}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body-regular text-text-secondary">ยังไม่มีรีวิว</p>
            )}
          </Section>

          <Section id="location" title="ที่ตั้ง">
            {dorm.nearby.length ? (
              <ul className="flex flex-wrap gap-2" aria-label="สถานที่ใกล้เคียง">
                {dorm.nearby.map((placeName) => (
                  <li key={placeName} className="rounded-full bg-background-tertiary-default px-3 py-1 text-caption-1-medium text-text-secondary">
                    {placeName}
                  </li>
                ))}
              </ul>
            ) : null}
            {dorm.lat != null && dorm.lng != null ? (
              <>
                <LocationMap
                  lat={dorm.lat}
                  lng={dorm.lng}
                  label={`แผนที่ตำแหน่งของ ${dorm.name}`}
                  className="relative z-0 h-80 w-full overflow-hidden rounded-3xl border border-border-button-default bg-background-tertiary-default shadow-sm"
                />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${dorm.lat},${dorm.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 self-start rounded-md text-body-medium text-text-secondary outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring"
                >
                  เปิดใน Google Maps
                  <RiExternalLinkLine className="size-4" aria-hidden />
                </a>
              </>
            ) : (
              <p className="text-body-regular text-text-secondary">เจ้าของหอยังไม่ได้ปักหมุดตำแหน่ง</p>
            )}
          </Section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24" aria-label="สรุปและติดต่อ">
          <div className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-lg">
            {from != null ? (
              <p className="flex items-baseline gap-1">
                <span className="text-body-regular text-text-secondary">เริ่มต้น</span>
                <span className="text-title-1-semibold text-text-primary tabular-nums">{baht(from)}</span>
                <span className="text-body-regular text-text-secondary">/เดือน</span>
              </p>
            ) : null}
            <p className="text-body-regular text-text-secondary">
              {vacant > 0 ? `ตอนนี้มีห้องว่าง ${vacant} ห้อง จาก ${rooms.length} ห้อง` : "ตอนนี้ห้องเต็มทุกห้อง"}
            </p>
            <StartChatButton dormId={dorm.id}>แชทกับเจ้าของหอ</StartChatButton>
            <Suspense fallback={null}>
              <ChatUnavailableNotice searchParams={searchParams} />
            </Suspense>
            <p className="text-caption-1-regular text-text-tertiary">ถามรายละเอียด นัดดูห้อง หรือส่งคำขอจองพร้อมวันเข้าอยู่ได้ในแชท</p>
          </div>

          <div className="flex items-start gap-3 rounded-3xl bg-background-secondary-default p-4">
            <RiShieldCheckLine className="mt-0.5 size-5 shrink-0 text-foreground-icon-secondary" aria-hidden />
            <p className="text-caption-1-regular text-text-secondary">
              อย่าโอนเงินมัดจำก่อนดูห้องจริง หรือก่อนเจ้าของหอยืนยันการจองในระบบ
            </p>
          </div>

          {owner ? (
            <div className="flex items-center gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-4 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-full bg-background-tertiary-default">
                <RiUser3Line className="size-5 text-foreground-icon-secondary" aria-hidden />
              </span>
              <span className="flex flex-col">
                <span className="text-caption-1-regular text-text-tertiary">เจ้าของหอ</span>
                <span className="text-body-medium text-text-primary">{owner.display_name ?? "เจ้าของหอ"}</span>
              </span>
              {owner.verified_at ? (
                <Chip color="blue" variant="caption" className="ms-auto inline-flex items-center gap-1">
                  <RiVerifiedBadgeFill className="size-3.5" aria-hidden />
                  Verified
                </Chip>
              ) : null}
            </div>
          ) : null}

          <Suspense fallback={null}>
            <ReportSlot dormId={dorm.id} />
          </Suspense>
        </aside>
      </div>
    </>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-24 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="text-title-2-semibold text-text-primary">
          {title}
        </h2>
        {description ? <p className="text-body-regular text-text-secondary">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
