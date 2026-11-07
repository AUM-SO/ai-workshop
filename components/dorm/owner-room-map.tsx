"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { RiCheckLine, RiDeleteBinLine } from "@remixicon/react";
import {
  Dropdown,
  DropdownDivider,
  DropdownGroup,
  DropdownItem,
  DropdownPopover,
  DropdownTrigger,
} from "@/components/base/dropdown/dropdown";
import { deleteRoom, setRoomStatus } from "@/app/owner/dorms/room-actions";
import { ROOM_STATUS_LABEL, ROOM_STATUS_STYLE } from "@/components/dorm/room-grid";
import { ROOM_STATUSES, type RoomStatus } from "@/lib/dorms/options";
import { cx } from "@/utils/cx";

export interface OwnerRoom {
  id: string;
  room_no: string;
  floor: number;
  status: RoomStatus;
  room_type_id: string;
}

interface OwnerRoomMapProps {
  dormId: string;
  rooms: OwnerRoom[];
  roomTypes: { id: string; name: string }[];
}

type Change = { type: "status"; id: string; status: RoomStatus } | { type: "delete"; id: string };

const collator = new Intl.Collator("th", { numeric: true });

/** The owner's floor-by-floor room map: pick a room to change its status or delete it. */
export function OwnerRoomMap({ dormId, rooms, roomTypes }: OwnerRoomMapProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [optimistic, apply] = useOptimistic(rooms, (current, change: Change) =>
    change.type === "delete"
      ? current.filter((r) => r.id !== change.id)
      : current.map((r) => (r.id === change.id ? { ...r, status: change.status } : r)),
  );

  const typeName = useMemo(() => new Map(roomTypes.map((t) => [t.id, t.name])), [roomTypes]);
  const visible = optimistic.filter((r) => typeFilter === "all" || r.room_type_id === typeFilter);

  const floors = useMemo(() => {
    const byFloor = new Map<number, OwnerRoom[]>();
    for (const room of visible) byFloor.set(room.floor, [...(byFloor.get(room.floor) ?? []), room]);
    return [...byFloor.entries()]
      .sort(([a], [b]) => b - a)
      .map(([floor, list]) => ({ floor, rooms: list.sort((a, b) => collator.compare(a.room_no, b.room_no)) }));
  }, [visible]);

  const counts = ROOM_STATUSES.map((status) => ({ status, count: visible.filter((r) => r.status === status).length }));

  const run = (change: Change, action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      setError(null);
      apply(change);
      const result = await action();
      if (result.error) setError(result.error);
    });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="จำนวนห้องตามสถานะ">
          {counts.map(({ status, count }) => (
            <li key={status} className="flex items-center gap-1.5 text-body-regular text-text-secondary">
              <span aria-hidden className={cx("size-3 rounded-sm", ROOM_STATUS_STYLE[status])} />
              {ROOM_STATUS_LABEL[status]} <span className="text-body-medium text-text-primary tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
        {roomTypes.length > 1 ? (
          <div role="group" aria-label="กรองตามประเภทห้อง" className="flex flex-wrap gap-1">
            {[{ id: "all", name: "ทุกประเภท" }, ...roomTypes].map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={typeFilter === t.id}
                onClick={() => setTypeFilter(t.id)}
                className={cx(
                  "rounded-full px-3 py-1 text-caption-1-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring",
                  typeFilter === t.id
                    ? "bg-status-blue-background text-status-blue-text"
                    : "bg-background-tertiary-default text-text-secondary hover:text-text-primary",
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {floors.length === 0 ? (
        <p className="text-body-regular text-text-secondary">ยังไม่มีห้อง เพิ่มห้องด้วยฟอร์มด้านบน</p>
      ) : (
        <div className={cx("flex flex-col gap-3", pending && "opacity-90")}>
          {floors.map(({ floor, rooms: floorRooms }) => (
            <section key={floor} aria-label={`ชั้น ${floor}`} className="flex items-start gap-3">
              <span className="w-12 shrink-0 pt-2.5 text-caption-1-medium text-text-tertiary">ชั้น {floor}</span>
              <ul className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-1.5">
                {floorRooms.map((room) => (
                  <li key={room.id}>
                    <RoomCell
                      room={room}
                      typeName={typeName.get(room.room_type_id) ?? ""}
                      onStatus={(status) =>
                        run({ type: "status", id: room.id, status }, () => setRoomStatus(dormId, room.id, status))
                      }
                      onDelete={() => run({ type: "delete", id: room.id }, () => deleteRoom(dormId, room.id))}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p aria-live="polite" className="text-body-regular text-text-error-primary">
        {error}
      </p>
    </div>
  );
}

interface RoomCellProps {
  room: OwnerRoom;
  typeName: string;
  onStatus: (status: RoomStatus) => void;
  onDelete: () => void;
}

/** One room on the map; its menu closes as soon as a choice is made. */
function RoomCell({ room, typeName, onStatus, onDelete }: RoomCellProps) {
  const [open, setOpen] = useState(false);
  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <Dropdown isOpen={open} onOpenChange={setOpen}>
      <DropdownTrigger
        aria-label={`ห้อง ${room.room_no} ${typeName} สถานะ${ROOM_STATUS_LABEL[room.status]}`}
        className={cx(
          "flex h-11 w-full cursor-pointer flex-col items-center justify-center rounded-lg text-caption-1-semibold tabular-nums transition-[filter] outline-none",
          "hover:brightness-95 focus-visible:ring-2 focus-visible:ring-border-focus-ring",
          ROOM_STATUS_STYLE[room.status],
        )}
      >
        {room.room_no}
      </DropdownTrigger>
      <DropdownPopover aria-label={`ห้อง ${room.room_no}`} placement="bottom start">
        <div className="px-2 py-1.5 text-caption-1-medium text-text-tertiary">
          ห้อง {room.room_no} · {typeName}
        </div>
        <DropdownGroup>
          {ROOM_STATUSES.map((status) => (
            <DropdownItem
              key={status}
              selected={room.status === status}
              onSelect={() => choose(() => room.status !== status && onStatus(status))}
            >
              <span aria-hidden className={cx("size-3 rounded-sm", ROOM_STATUS_STYLE[status])} />
              <span className="flex-1">{ROOM_STATUS_LABEL[status]}</span>
              {room.status === status ? <RiCheckLine className="size-4 text-foreground-icon-secondary" aria-hidden /> : null}
            </DropdownItem>
          ))}
        </DropdownGroup>
        <DropdownDivider />
        <DropdownItem onSelect={() => choose(onDelete)}>
          <RiDeleteBinLine className="size-4 text-foreground-icon-secondary" aria-hidden />
          ลบห้องนี้
        </DropdownItem>
      </DropdownPopover>
    </Dropdown>
  );
}
