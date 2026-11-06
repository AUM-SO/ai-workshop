import { Suspense } from "react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/base/buttons/button";
import { BulkRoomsForm } from "@/components/dorm/bulk-rooms-form";
import { OwnerRoomMap } from "@/components/dorm/owner-room-map";
import { getOwnedDorm } from "@/lib/dorms/owner";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "ผังห้อง" };

export default function RoomsPage(props: PageProps<"/owner/dorms/[dormId]/rooms">) {
  return (
    <Suspense fallback={null}>
      <Rooms {...props} />
    </Suspense>
  );
}

async function Rooms({ params }: PageProps<"/owner/dorms/[dormId]/rooms">) {
  const { dormId } = await params;
  const dorm = await getOwnedDorm(dormId);
  const supabase = await createClient();
  const [{ data: roomTypes }, { data: rooms }] = await Promise.all([
    supabase.from("room_types").select("id, name").eq("dorm_id", dorm.id).order("monthly_price"),
    supabase.from("rooms").select("id, room_no, floor, status, room_type_id").eq("dorm_id", dorm.id),
  ]);

  if (!roomTypes?.length) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-3xl border border-dashed border-border-button-default p-8">
        <p className="text-body-medium text-text-primary">เพิ่มประเภทห้องก่อน</p>
        <p className="text-body-regular text-text-secondary">ห้องแต่ละห้องต้องมีประเภท เพื่อให้ผู้เช่าเห็นราคาและเงื่อนไข</p>
        <ButtonLink href={`/owner/dorms/${dorm.id}/room-types/new`}>เพิ่มประเภทห้อง</ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-labelledby="add-rooms-title"
        className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6"
      >
        <div className="flex flex-col gap-1">
          <h2 id="add-rooms-title" className="text-title-3-semibold text-text-primary">
            เพิ่มห้อง
          </h2>
          <p className="text-body-regular text-text-secondary">เพิ่มทีละชั้น ห้องที่มีเลขซ้ำกับของเดิมจะถูกข้ามให้อัตโนมัติ</p>
        </div>
        <BulkRoomsForm dormId={dorm.id} roomTypes={roomTypes} />
      </section>

      <section
        aria-labelledby="room-map-title"
        className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6"
      >
        <div className="flex flex-col gap-1">
          <h2 id="room-map-title" className="text-title-3-semibold text-text-primary">
            ผังห้อง
          </h2>
          <p className="text-body-regular text-text-secondary">
            กดที่ห้องเพื่อเปลี่ยนสถานะ ผู้เช่าจะเห็นสถานะนี้ในหน้าหอทันทีที่เผยแพร่
          </p>
        </div>
        <OwnerRoomMap dormId={dorm.id} rooms={rooms ?? []} roomTypes={roomTypes} />
      </section>
    </div>
  );
}
