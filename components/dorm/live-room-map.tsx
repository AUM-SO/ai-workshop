"use client";

import { useEffect, useMemo, useState } from "react";
import { RoomGrid, toFloors, type RoomStatus } from "@/components/dorm/room-grid";
import { createClient } from "@/lib/supabase/client";
import { cx } from "@/utils/cx";

interface LiveRoom {
  id: string;
  room_no: string;
  floor: number;
  status: RoomStatus;
}

interface LiveRoomMapProps {
  dormId: string;
  dormName: string;
  /** Rooms from the (possibly cached) server render; refreshed on mount, then kept live. */
  initialRooms: LiveRoom[];
}

type Connection = "connecting" | "live" | "offline";

/**
 * The tenant's room map. Statuses stream in over Supabase Realtime as the owner
 * changes them, so "vacant" on this page means vacant now.
 */
export function LiveRoomMap({ dormId, dormName, initialRooms }: LiveRoomMapProps) {
  const [rooms, setRooms] = useState(initialRooms);
  const [changedNo, setChangedNo] = useState<string>();
  const [connection, setConnection] = useState<Connection>("connecting");

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    // The server copy may be cached; read the current statuses once before listening.
    supabase
      .from("rooms")
      .select("id, room_no, floor, status")
      .eq("dorm_id", dormId)
      .then(({ data }) => {
        if (active && data) setRooms(data);
      });

    const channel = supabase
      .channel(`rooms:${dormId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `dorm_id=eq.${dormId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string }).id;
            setRooms((list) => list.filter((r) => r.id !== id));
            return;
          }
          const row = payload.new as LiveRoom;
          setChangedNo(row.room_no);
          setRooms((list) =>
            list.some((r) => r.id === row.id)
              ? list.map((r) => (r.id === row.id ? { ...r, status: row.status, floor: row.floor, room_no: row.room_no } : r))
              : [...list, row],
          );
        },
      )
      .subscribe((status) => {
        if (!active) return;
        setConnection(status === "SUBSCRIBED" ? "live" : status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "offline" : "connecting");
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [dormId]);

  const floors = useMemo(() => toFloors(rooms), [rooms]);

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-caption-1-medium text-text-secondary" aria-live="polite">
        <span aria-hidden className="relative flex size-2">
          {connection === "live" ? (
            <span className="absolute inline-flex size-full rounded-full bg-status-lime-text opacity-60 motion-safe:animate-ping" />
          ) : null}
          <span
            className={cx(
              "relative inline-flex size-2 rounded-full",
              connection === "live" ? "bg-status-lime-text" : "bg-foreground-icon-quaternary",
            )}
          />
        </span>
        {connection === "live" ? "อัปเดตสดจากเจ้าของหอ" : connection === "offline" ? "การเชื่อมต่อขาด แสดงข้อมูลล่าสุดที่โหลดไว้" : "กำลังเชื่อมต่อ…"}
      </p>
      <RoomGrid floors={floors} animated changedNo={changedNo} label={`ผังห้องของ ${dormName}`} />
    </div>
  );
}
