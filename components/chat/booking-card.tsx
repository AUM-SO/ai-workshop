"use client";

import { useState, useTransition } from "react";
import { RiCalendarCheckLine, RiTimeLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { Select, SelectItem } from "@/components/base/select/select";
import { cancelBooking, respondBooking } from "@/app/chat/actions";
import type { Database } from "@/lib/supabase/database.types";

type Booking = Omit<Database["public"]["Tables"]["bookings"]["Row"], "booking_label">;
type BookingStatus = Database["public"]["Enums"]["booking_status"];

export const BOOKING_STATUS: Record<BookingStatus, { label: string; color: ChipColor }> = {
  pending: { label: "รอเจ้าของหอตอบ", color: "yellow" },
  held: { label: "กันห้องไว้แล้ว", color: "blue" },
  confirmed: { label: "ยืนยันการจองแล้ว", color: "lime" },
  declined: { label: "ถูกปฏิเสธ", color: "rose" },
  cancelled: { label: "ยกเลิกแล้ว", color: "neutral" },
  expired: { label: "หมดเวลากันห้อง", color: "neutral" },
};

const dateFormat = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface BookingCardProps {
  booking: Booking;
  role: "tenant" | "owner";
  roomTypeName: string;
  roomNo?: string;
  /** Vacant rooms of the requested type (owner only), plus the one already held. */
  rooms: { id: string; room_no: string }[];
}

export function BookingCard({ booking, role, roomTypeName, roomNo, rooms }: BookingCardProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | undefined>(booking.room_id ?? rooms[0]?.id);
  const [hours, setHours] = useState("24");
  const status = BOOKING_STATUS[booking.status];
  const open = booking.status === "pending" || booking.status === "held";

  const run = (action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (result.error) setError(result.error);
    });

  return (
    <div className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-border-button-default bg-background-primary-default p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-2 text-headline-semibold text-text-primary">
          <RiCalendarCheckLine className="size-5 text-foreground-icon-secondary" aria-hidden />
          คำขอจอง
        </span>
        <Chip color={status.color} variant="caption">
          {status.label}
        </Chip>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-body-regular">
        <dt className="text-text-secondary">ห้อง</dt>
        <dd className="text-text-primary">
          {roomTypeName}
          {roomNo ? ` · ห้อง ${roomNo}` : ""}
        </dd>
        <dt className="text-text-secondary">เข้าอยู่</dt>
        <dd className="text-text-primary">{dateFormat.format(new Date(booking.move_in_date))}</dd>
        <dt className="text-text-secondary">สัญญา</dt>
        <dd className="text-text-primary">{booking.months} เดือน</dd>
        {booking.note ? (
          <>
            <dt className="text-text-secondary">หมายเหตุ</dt>
            <dd className="text-text-primary">{booking.note}</dd>
          </>
        ) : null}
      </dl>
      {booking.status === "held" && booking.held_until ? (
        <p className="flex items-center gap-1.5 text-caption-1-medium text-status-blue-text">
          <RiTimeLine className="size-4" aria-hidden />
          กันห้องไว้ถึง {timeFormat.format(new Date(booking.held_until))} น.
        </p>
      ) : null}

      {open && role === "owner" ? (
        <div className="flex flex-col gap-2 border-t border-separator-border pt-3">
          {rooms.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Select aria-label="เลือกห้อง" size="sm" selectedKey={roomId} onSelectionChange={(k) => setRoomId(String(k))} triggerClassName="w-full">
                {rooms.map((room) => (
                  <SelectItem key={room.id} id={room.id} textValue={`ห้อง ${room.room_no}`}>
                    ห้อง {room.room_no}
                  </SelectItem>
                ))}
              </Select>
              <Select
                aria-label="ระยะเวลากันห้อง"
                size="sm"
                selectedKey={hours}
                onSelectionChange={(k) => setHours(String(k))}
                triggerClassName="w-full"
              >
                {["24", "48", "72"].map((h) => (
                  <SelectItem key={h} id={h} textValue={`กันไว้ ${h} ชั่วโมง`}>
                    กันไว้ {h} ชั่วโมง
                  </SelectItem>
                ))}
              </Select>
            </div>
          ) : (
            <p className="text-caption-1-regular text-text-secondary">ไม่มีห้องว่างในประเภทนี้ ปฏิเสธคำขอ หรือคุยเสนอห้องประเภทอื่นในแชท</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="small" disabled={pending || !roomId} onClick={() => run(() => respondBooking(booking.id, "confirm", roomId))}>
              ยืนยันการจอง
            </Button>
            {booking.status === "pending" ? (
              <Button
                size="small"
                variant="secondary"
                disabled={pending || !roomId}
                onClick={() => run(() => respondBooking(booking.id, "hold", roomId, Number(hours)))}
              >
                กันห้องไว้ก่อน
              </Button>
            ) : null}
            <Button size="small" variant="ghost" disabled={pending} onClick={() => run(() => respondBooking(booking.id, "decline"))}>
              ปฏิเสธ
            </Button>
          </div>
        </div>
      ) : null}

      {open && role === "tenant" ? (
        <div className="flex border-t border-separator-border pt-3">
          <Button size="small" variant="ghost" disabled={pending} onClick={() => run(() => cancelBooking(booking.id))}>
            ยกเลิกคำขอ
          </Button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-caption-1-regular text-text-error-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}
