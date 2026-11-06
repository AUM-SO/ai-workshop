import Image from "next/image";
import Link from "next/link";
import { RiImageLine, RiMapPin2Line } from "@remixicon/react";
import { Chip } from "@/components/base/badges/chip";
import { baht } from "@/lib/dorms/costs";
import { GENDER_POLICY_LABEL } from "@/lib/dorms/options";
import type { SearchResult } from "@/lib/dorms/search";

export function DormResultCard({ dorm, priority = false }: { dorm: SearchResult; priority?: boolean }) {
  const place = [dorm.district, dorm.province].filter(Boolean).join(", ");
  const price =
    dorm.min_price == null
      ? null
      : dorm.max_price && dorm.max_price !== dorm.min_price
        ? `${baht(dorm.min_price)}–${baht(dorm.max_price).replace("฿", "")}`
        : baht(dorm.min_price);

  return (
    <Link
      href={`/dorms/${dorm.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default shadow-sm outline-none transition-[border-color,box-shadow,translate] duration-200 hover:border-border-button-hover hover:shadow-lg focus-visible:ring-2 focus-visible:ring-border-focus-ring motion-safe:hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] bg-background-tertiary-default">
        {dorm.cover_url ? (
          <Image
            src={dorm.cover_url}
            alt=""
            fill
            preload={priority}
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-foreground-icon-quaternary">
            <RiImageLine className="size-8" aria-hidden />
          </span>
        )}
        <div className="absolute start-3 top-3 flex gap-1.5">
          <Chip color="soft" variant="caption">
            {GENDER_POLICY_LABEL[dorm.gender_policy]}
          </Chip>
          <Chip color={dorm.vacant_rooms > 0 ? "lime" : "neutral"} variant="caption">
            {dorm.vacant_rooms > 0 ? `ว่าง ${dorm.vacant_rooms} ห้อง` : "เต็ม"}
          </Chip>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="text-headline-semibold text-text-primary group-hover:underline">{dorm.name}</h2>
        {place ? (
          <p className="flex items-center gap-1 text-caption-1-regular text-text-tertiary">
            <RiMapPin2Line className="size-3.5 shrink-0" aria-hidden />
            {place}
          </p>
        ) : null}
        {dorm.nearby.length ? (
          <p className="line-clamp-1 text-caption-1-regular text-text-secondary">ใกล้ {dorm.nearby.slice(0, 3).join(" · ")}</p>
        ) : null}
        {price ? (
          <p className="mt-auto flex items-baseline gap-1 pt-2">
            <span className="text-title-3-semibold text-text-primary tabular-nums">{price}</span>
            <span className="text-caption-1-regular text-text-secondary">/เดือน</span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}
