import type { CSSProperties } from "react";
import { cx } from "@/utils/cx";
import "./room-grid.css";

export type RoomStatus = "vacant" | "held" | "occupied" | "maintenance";

export interface RoomCell {
  no: string;
  status: RoomStatus;
}

export interface RoomFloor {
  floor: number;
  rooms: RoomCell[];
}

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  vacant: "ว่าง",
  held: "ติดจอง",
  occupied: "มีผู้เช่า",
  maintenance: "ปิดปรับปรุง",
};

/** Status colours ride the status tokens, so they flip with dark mode. Always shown with a text label. */
export const ROOM_STATUS_STYLE: Record<RoomStatus, string> = {
  vacant: "bg-status-lime-background text-status-lime-text",
  held: "bg-status-yellow-background text-status-yellow-text",
  occupied: "bg-background-tertiary-default text-text-tertiary",
  maintenance: "bg-status-rose-background text-status-rose-text",
};

const STATUS_ORDER: RoomStatus[] = ["vacant", "held", "occupied", "maintenance"];

export function countRooms(floors: RoomFloor[]) {
  const counts: Record<RoomStatus, number> = { vacant: 0, held: 0, occupied: 0, maintenance: 0 };
  for (const floor of floors) for (const room of floor.rooms) counts[room.status] += 1;
  return counts;
}

/** Plain-language summary of the grid, used as its accessible name. */
export function describeRooms(floors: RoomFloor[]) {
  const counts = countRooms(floors);
  return STATUS_ORDER.filter((status) => counts[status] > 0)
    .map((status) => `${ROOM_STATUS_LABEL[status]} ${counts[status]} ห้อง`)
    .join(" ");
}

interface RoomGridProps {
  floors: RoomFloor[];
  /** Accessible name. Defaults to a count of rooms per status. */
  label?: string;
  /**
   * Pop the cells in on mount, and pop a cell again when its status changes.
   */
  animated?: boolean;
  /** Room number that just changed; it pops without the entrance stagger. */
  changedNo?: string;
  /** Fixed number of rooms per row. By default rows fill the width with cells of at least 3rem. */
  columns?: number;
  className?: string;
}

/** Floor-by-floor room map. Read-only; the owner's editable version builds on the same cells. */
export function RoomGrid({ floors, label, animated = false, changedNo, columns, className }: RoomGridProps) {
  const counts = countRooms(floors);
  let cellIndex = 0;

  return (
    <div className={cx("flex flex-col gap-4", className)}>
      <div role="img" aria-label={label ?? `ผังห้อง: ${describeRooms(floors)}`} className="flex flex-col gap-3">
        {floors.map(({ floor, rooms }) => (
          <div key={floor} className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-caption-1-medium text-text-tertiary">ชั้น {floor}</span>
            <div
              className={cx("grid flex-1 gap-1.5", !columns && "grid-cols-[repeat(auto-fill,minmax(3rem,1fr))]")}
              style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
            >
              {rooms.map((room) => (
                <span
                  // Keyed on status too, so an animated cell remounts and replays its pop when it changes.
                  key={animated ? `${room.no}-${room.status}` : room.no}
                  data-changed={animated && room.no === changedNo ? "" : undefined}
                  style={animated ? ({ "--i": cellIndex++ } as CSSProperties) : undefined}
                  className={cx(
                    "flex h-10 items-center justify-center rounded-lg text-caption-1-semibold tabular-nums transition-colors duration-500",
                    ROOM_STATUS_STYLE[room.status],
                    animated && "room-cell-animated",
                  )}
                >
                  {room.no}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="ความหมายของสี">
        {STATUS_ORDER.filter((status) => counts[status] > 0).map((status) => (
          <li key={status} className="flex items-center gap-1.5 text-caption-1-regular text-text-secondary">
            <span aria-hidden className={cx("size-3 rounded-sm", ROOM_STATUS_STYLE[status])} />
            {ROOM_STATUS_LABEL[status]} {counts[status]}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Groups a flat room list into floors (top floor first) with natural room-number order. */
export function toFloors(rooms: { room_no: string; floor: number; status: RoomStatus }[]): RoomFloor[] {
  const collator = new Intl.Collator("th", { numeric: true });
  const byFloor = new Map<number, RoomCell[]>();
  for (const room of rooms) {
    byFloor.set(room.floor, [...(byFloor.get(room.floor) ?? []), { no: room.room_no, status: room.status }]);
  }
  return [...byFloor.entries()]
    .sort(([a], [b]) => b - a)
    .map(([floor, cells]) => ({ floor, rooms: cells.sort((a, b) => collator.compare(a.no, b.no)) }));
}
