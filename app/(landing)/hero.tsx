import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { RiArrowRightLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Chip } from "@/components/base/badges/chip";
import { SearchField } from "@/components/base/search-field/search-field";
import roomPhoto from "@/assets/images/landing/room-bedroom.jpg";
import { LiveRoomGridPreview } from "./room-grid-preview";

/** Staggers the hero entrance (see .landing-rise in landing.css). */
const rise = (ms: number) => ({ "--rise-delay": `${ms}ms` }) as CSSProperties;

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-10 pb-12 sm:pt-16 sm:pb-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16"
    >
      <div className="flex flex-col items-start gap-6">
        <Chip color="blue" variant="caption" className="landing-rise gap-1.5" style={rise(0)}>
          {/* Live dot: a steady core with a ring that pings outward. */}
          <span aria-hidden className="relative flex size-1.5">
            <span className="absolute inline-flex size-full rounded-full bg-status-blue-text opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex size-1.5 rounded-full bg-status-blue-text" />
          </span>
          ห้องว่างอัปเดตแบบ real-time
        </Chip>
        <h1
          id="hero-title"
          style={rise(80)}
          className="landing-rise text-display-4-semibold text-text-primary sm:text-display-2-semibold"
        >
          หาหอพักที่ว่างจริง และจองได้ทันทีผ่านแชท
        </h1>
        <p style={rise(160)} className="landing-rise max-w-xl text-title-3-regular text-text-secondary">
          ค้นหาหอใกล้มหาวิทยาลัย ที่ทำงาน หรือรถไฟฟ้า เห็นค่าใช้จ่ายทั้งหมดก่อนตัดสินใจ แล้วคุยกับเจ้าของหอโดยตรง
        </p>

        {/* A plain GET form, so search works before (or without) JavaScript. */}
        <form
          action="/search"
          method="get"
          role="search"
          data-analytics="landing_search_submit"
          style={rise(240)}
          className="landing-rise flex w-full max-w-xl flex-col gap-2 sm:flex-row"
        >
          <SearchField
            name="q"
            aria-label="ค้นหาหอพัก"
            placeholder="ชื่อมหาวิทยาลัย, สถานี BTS/MRT หรือย่าน"
            clearLabel="ล้างคำค้นหา"
            className="flex-1"
          />
          <Button type="submit">ค้นหา</Button>
        </form>

        <Link
          href="/signup?role=owner"
          data-analytics="landing_owner_cta_click"
          style={rise(320)}
          className="group landing-rise inline-flex items-center gap-1 rounded-md text-body-medium text-text-secondary outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring"
        >
          เป็นเจ้าของหอ? ลงประกาศฟรี
          <RiArrowRightLine
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>

      {/* A room photo with the live room map floating over its lower half. */}
      <div className="landing-rise flex flex-col" style={rise(200)}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-background-tertiary-default">
          <Image
            src={roomPhoto}
            alt="ห้องพักขนาดเล็กตกแต่งอบอุ่น มีเตียงริมหน้าต่างและต้นไม้แขวน"
            fill
            preload
            placeholder="blur"
            sizes="(min-width: 1024px) 520px, 100vw"
            className="object-cover"
          />
        </div>
        <div className="relative -mt-20 px-3 sm:-mt-28 sm:px-6">
          <div className="rounded-3xl shadow-lg">
            <LiveRoomGridPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
