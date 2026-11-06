import { RiChat3Line } from "@remixicon/react";
import { Chip } from "@/components/base/badges/chip";
import { RoomGrid, describeRooms, type RoomFloor } from "@/components/dorm/room-grid";

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

export function RoomGridPreview() {
  return (
    <div className="flex w-full flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-xs sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-headline-semibold text-text-primary">บ้านสวนเรสซิเดนซ์</p>
          <p className="text-caption-1-regular text-text-tertiary">ห้องสตูดิโอ 24 ตร.ม. · อัปเดตเมื่อสักครู่</p>
        </div>
        <Chip color="soft" variant="caption">
          ตัวอย่าง
        </Chip>
      </div>

      <RoomGrid floors={SAMPLE_FLOORS} label={`ตัวอย่างผังห้อง: ${describeRooms(SAMPLE_FLOORS)}`} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-separator-border pt-4">
        <div className="flex flex-col">
          <span className="text-caption-1-regular text-text-tertiary">จ่ายวันเข้าอยู่</span>
          <span className="text-headline-semibold text-text-primary tabular-nums">฿13,500</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-status-blue-background px-3 py-1.5 text-body-medium text-status-blue-text">
          <RiChat3Line className="size-4" aria-hidden />
          แชทเพื่อจองห้อง 302
        </span>
      </div>
    </div>
  );
}
