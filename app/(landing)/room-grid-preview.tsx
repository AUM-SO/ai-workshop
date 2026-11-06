"use client";

import { useEffect, useRef, useState } from "react";
import { RiChat3Line } from "@remixicon/react";
import { Chip } from "@/components/base/badges/chip";
import { RoomGrid, describeRooms, type RoomFloor, type RoomStatus } from "@/components/dorm/room-grid";

// Fixed sample data for the hero illustration; it is labelled as a sample on screen.
const SAMPLE_FLOORS: RoomFloor[] = [
  {
    floor: 3,
    rooms: [
      { no: "301", status: "occupied" },
      { no: "302", status: "vacant" },
      { no: "303", status: "held" },
      { no: "304", status: "occupied" },
      { no: "305", status: "vacant" },
      { no: "306", status: "occupied" },
    ],
  },
  {
    floor: 2,
    rooms: [
      { no: "201", status: "vacant" },
      { no: "202", status: "occupied" },
      { no: "203", status: "occupied" },
      { no: "204", status: "vacant" },
      { no: "205", status: "held" },
      { no: "206", status: "vacant" },
    ],
  },
];

/**
 * A scripted loop of booking events. Applied in order they end where they began,
 * so the loop repeats without a jump.
 */
const EVENTS: { no: string; to: RoomStatus; note: string }[] = [
  { no: "302", to: "held", note: "มีคนขอจองห้อง 302 ผ่านแชท" },
  { no: "205", to: "vacant", note: "ห้อง 205 หมดเวลาจอง กลับมาว่าง" },
  { no: "306", to: "vacant", note: "ห้อง 306 ว่างแล้ว" },
  { no: "205", to: "held", note: "มีคนขอจองห้อง 205 ผ่านแชท" },
  { no: "306", to: "occupied", note: "ห้อง 306 มีผู้เช่าแล้ว" },
  { no: "302", to: "vacant", note: "ห้อง 302 หมดเวลาจอง กลับมาว่าง" },
];

const STEP_MS = 2600;
const FIRST_STEP_MS = 2200; // after the cells finish popping in

function applyEvents(step: number): RoomFloor[] {
  const status = new Map<string, RoomStatus>();
  for (const event of EVENTS.slice(0, step)) status.set(event.no, event.to);
  return SAMPLE_FLOORS.map((floor) => ({
    ...floor,
    rooms: floor.rooms.map((room) => ({ ...room, status: status.get(room.no) ?? room.status })),
  }));
}

/** Hero illustration: a sample room map whose rooms change status on their own, like the real one. */
export function LiveRoomGridPreview() {
  const rootRef = useRef<HTMLDivElement>(null);
  // `step` counts events applied since the loop began; 0 is the initial map.
  const [step, setStep] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let visible = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = (ms: number) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (visible && document.visibilityState === "visible") setStep((s) => (s % EVENTS.length) + 1);
        schedule(STEP_MS);
      }, ms);
    };

    // Only run while the card is on screen.
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(root);
    schedule(FIRST_STEP_MS);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const floors = applyEvents(step);
  const event = step > 0 ? EVENTS[step - 1] : undefined;

  return (
    <div
      ref={rootRef}
      className="flex w-full flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-xs sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-headline-semibold text-text-primary">บ้านสวนเรสซิเดนซ์</p>
          <p className="text-caption-1-regular text-text-tertiary">ห้องสตูดิโอ 24 ตร.ม.</p>
        </div>
        <Chip color="soft" variant="caption">
          ตัวอย่าง
        </Chip>
      </div>

      <RoomGrid
        floors={floors}
        animated
        changedNo={event?.no}
        label={`ตัวอย่างผังห้องที่อัปเดตสถานะเอง: ${describeRooms(floors)}`}
      />

      {/* Decorative ticker; the grid's own label carries the content for assistive tech. */}
      <p aria-hidden className="flex h-5 items-center gap-2 text-caption-1-regular text-text-secondary">
        <span className="relative flex size-1.5 shrink-0">
          <span className="absolute inline-flex size-full rounded-full bg-status-lime-text opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex size-1.5 rounded-full bg-status-lime-text" />
        </span>
        <span key={step} className="animate-number-fade truncate">
          {event?.note ?? "อัปเดตเมื่อสักครู่"}
        </span>
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-separator-border pt-4">
        <div className="flex flex-col">
          <span className="text-caption-1-regular text-text-tertiary">จ่ายวันเข้าอยู่</span>
          <span className="text-headline-semibold text-text-primary tabular-nums">฿13,500</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-status-blue-background px-3 py-1.5 text-body-medium text-status-blue-text">
          <RiChat3Line className="size-4" aria-hidden />
          แชทเพื่อจอง
        </span>
      </div>
    </div>
  );
}
