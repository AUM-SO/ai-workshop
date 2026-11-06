import Link from "next/link";
import { RiArrowRightLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Chip } from "@/components/base/badges/chip";
import { SearchField } from "@/components/base/search-field/search-field";
import { RoomGridPreview } from "./room-grid-preview";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-10 pb-12 sm:pt-16 sm:pb-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16"
    >
      <div className="flex flex-col items-start gap-6">
        <Chip color="blue" variant="caption">
          ห้องว่างอัปเดตแบบ real-time
        </Chip>
        <h1 id="hero-title" className="text-display-4-semibold text-text-primary sm:text-display-2-semibold">
          หาหอพักที่ว่างจริง และจองได้ทันทีผ่านแชท
        </h1>
        <p className="max-w-xl text-title-3-regular text-text-secondary">
          ค้นหาหอใกล้มหาวิทยาลัย ที่ทำงาน หรือรถไฟฟ้า เห็นค่าใช้จ่ายทั้งหมดก่อนตัดสินใจ แล้วคุยกับเจ้าของหอโดยตรง
        </p>

        {/* A plain GET form, so search works before (or without) JavaScript. */}
        <form
          action="/search"
          method="get"
          role="search"
          data-analytics="landing_search_submit"
          className="flex w-full max-w-xl flex-col gap-2 sm:flex-row"
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
          className="inline-flex items-center gap-1 rounded-md text-body-medium text-text-secondary outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring"
        >
          เป็นเจ้าของหอ? ลงประกาศฟรี
          <RiArrowRightLine className="size-4 rtl:-scale-x-100" aria-hidden />
        </Link>
      </div>

      <RoomGridPreview />
    </section>
  );
}
