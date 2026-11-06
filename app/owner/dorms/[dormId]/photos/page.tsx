import { Suspense } from "react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/base/buttons/button";
import { PhotoManager } from "@/components/dorm/photo-manager";
import { getOwnedDorm } from "@/lib/dorms/owner";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "รูปภาพหอ" };

export default function DormPhotosPage(props: PageProps<"/owner/dorms/[dormId]/photos">) {
  return (
    <Suspense fallback={null}>
      <DormPhotos {...props} />
    </Suspense>
  );
}

async function DormPhotos({ params }: PageProps<"/owner/dorms/[dormId]/photos">) {
  const { dormId } = await params;
  const dorm = await getOwnedDorm(dormId);
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("dorm_photos")
    .select("id, url")
    .eq("dorm_id", dorm.id)
    .order("sort_order");

  return (
    <section
      aria-labelledby="photos-title"
      className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="photos-title" className="text-title-3-semibold text-text-primary">
            รูปภาพ
          </h2>
          <p className="text-body-regular text-text-secondary">
            รูปแรกคือรูปปกที่ผู้เช่าเห็นในผลการค้นหา ใช้ลูกศรเพื่อเรียงลำดับ
          </p>
        </div>
        {photos?.length ? (
          <ButtonLink href={`/owner/dorms/${dorm.id}/room-types`} variant="secondary">
            ไปเพิ่มประเภทห้อง
          </ButtonLink>
        ) : null}
      </div>
      <PhotoManager dormId={dorm.id} ownerId={dorm.owner_id} photos={photos ?? []} />
    </section>
  );
}
