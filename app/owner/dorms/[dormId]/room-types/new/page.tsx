import { Suspense } from "react";
import type { Metadata } from "next";
import { RoomTypeForm } from "@/components/dorm/room-type-form";
import { getOwnedDorm } from "@/lib/dorms/owner";

export const metadata: Metadata = { title: "เพิ่มประเภทห้อง" };

export default function NewRoomTypePage(props: PageProps<"/owner/dorms/[dormId]/room-types/new">) {
  return (
    <section
      aria-labelledby="new-type-title"
      className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-8"
    >
      <h2 id="new-type-title" className="text-title-3-semibold text-text-primary">
        เพิ่มประเภทห้อง
      </h2>
      <Suspense fallback={null}>
        <NewRoomType {...props} />
      </Suspense>
    </section>
  );
}

async function NewRoomType({ params }: PageProps<"/owner/dorms/[dormId]/room-types/new">) {
  const { dormId } = await params;
  const dorm = await getOwnedDorm(dormId);
  return <RoomTypeForm dormId={dorm.id} />;
}
