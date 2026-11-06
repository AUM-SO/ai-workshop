import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomTypeForm } from "@/components/dorm/room-type-form";
import { getOwnedDorm } from "@/lib/dorms/owner";
import { getRoomType } from "@/lib/dorms/room-types";

export const metadata: Metadata = { title: "แก้ไขประเภทห้อง" };

export default function EditRoomTypePage(props: PageProps<"/owner/dorms/[dormId]/room-types/[roomTypeId]">) {
  return (
    <section
      aria-labelledby="edit-type-title"
      className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-8"
    >
      <h2 id="edit-type-title" className="text-title-3-semibold text-text-primary">
        แก้ไขประเภทห้อง
      </h2>
      <Suspense fallback={null}>
        <EditRoomType {...props} />
      </Suspense>
    </section>
  );
}

async function EditRoomType({ params }: PageProps<"/owner/dorms/[dormId]/room-types/[roomTypeId]">) {
  const { dormId, roomTypeId } = await params;
  const dorm = await getOwnedDorm(dormId);
  const type = await getRoomType(dorm.id, roomTypeId);
  if (!type) notFound();

  return (
    <RoomTypeForm
      dormId={dorm.id}
      roomTypeId={type.id}
      values={{
        ...type,
        water_rate: type.water_rate == null ? null : Number(type.water_rate),
        electric_rate: type.electric_rate == null ? null : Number(type.electric_rate),
      }}
    />
  );
}
