import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { RiAddLine, RiPencilLine } from "@remixicon/react";
import { ButtonLink } from "@/components/base/buttons/button";
import { DeleteRoomTypeButton } from "@/components/dorm/delete-room-type-button";
import { baht, moveInTotal } from "@/lib/dorms/costs";
import { FURNITURE } from "@/lib/dorms/options";
import { getOwnedDorm } from "@/lib/dorms/owner";
import { listRoomTypes } from "@/lib/dorms/room-types";

export const metadata: Metadata = { title: "ประเภทห้อง" };

export default function RoomTypesPage(props: PageProps<"/owner/dorms/[dormId]/room-types">) {
  return (
    <Suspense fallback={null}>
      <RoomTypes {...props} />
    </Suspense>
  );
}

const furnitureLabel = new Map<string, string>(FURNITURE.map((f) => [f.key, f.label]));

async function RoomTypes({ params }: PageProps<"/owner/dorms/[dormId]/room-types">) {
  const { dormId } = await params;
  const dorm = await getOwnedDorm(dormId);
  const types = await listRoomTypes(dorm.id);
  const base = `/owner/dorms/${dorm.id}`;

  return (
    <section aria-labelledby="types-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="types-title" className="text-title-3-semibold text-text-primary">
            ประเภทห้อง
          </h2>
          <p className="text-body-regular text-text-secondary">
            ห้องที่ราคาและเงื่อนไขเหมือนกันจัดเป็นประเภทเดียวกัน แล้วค่อยเพิ่มเลขห้องในผังห้อง
          </p>
        </div>
        <ButtonLink href={`${base}/room-types/new`} leadingIcon={RiAddLine}>
          เพิ่มประเภทห้อง
        </ButtonLink>
      </div>

      {types.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-3xl border border-dashed border-border-button-default p-8">
          <p className="text-body-medium text-text-primary">ยังไม่มีประเภทห้อง</p>
          <p className="text-body-regular text-text-secondary">
            เริ่มจากห้องแบบที่มีมากที่สุดในหอ ใส่ค่าเช่า เงินมัดจำ และค่าน้ำค่าไฟ
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {types.map((type) => (
            <li
              key={type.id}
              className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-headline-semibold text-text-primary">
                    <Link
                      href={`${base}/room-types/${type.id}`}
                      className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-border-focus-ring"
                    >
                      {type.name}
                    </Link>
                  </h3>
                  <p className="text-caption-1-regular text-text-tertiary">
                    {type.size_sqm ? `${Number(type.size_sqm)} ตร.ม. · ` : ""}
                    {type.roomCount ? `${type.roomCount} ห้อง ว่าง ${type.vacantCount}` : "ยังไม่มีห้อง"}
                  </p>
                </div>
                <div className="flex items-start gap-1">
                  <ButtonLink
                    href={`${base}/room-types/${type.id}`}
                    variant="ghost"
                    size="small"
                    iconOnly
                    leadingIcon={RiPencilLine}
                    aria-label={`แก้ไข ${type.name}`}
                  />
                  <DeleteRoomTypeButton dormId={dorm.id} roomTypeId={type.id} name={type.name} roomCount={type.roomCount} />
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-body-regular">
                <dt className="text-text-secondary">ค่าเช่า/เดือน</dt>
                <dd className="text-end text-text-primary tabular-nums">{baht(type.monthly_price)}</dd>
                <dt className="text-text-secondary">จ่ายวันเข้าอยู่</dt>
                <dd className="text-end text-text-primary tabular-nums">{baht(moveInTotal(type))}</dd>
                <dt className="text-text-secondary">ค่าน้ำ</dt>
                <dd className="text-end text-text-primary">
                  {type.water_flat != null ? `${baht(type.water_flat)}/เดือน` : `${Number(type.water_rate)} บาท/หน่วย`}
                </dd>
                <dt className="text-text-secondary">ค่าไฟ</dt>
                <dd className="text-end text-text-primary">
                  {type.electric_rate != null ? `${Number(type.electric_rate)} บาท/หน่วย` : "ตามการไฟฟ้า"}
                </dd>
              </dl>

              {type.furniture.length ? (
                <p className="text-caption-1-regular text-text-secondary">
                  {type.furniture.map((key) => furnitureLabel.get(key) ?? key).join(" · ")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {types.length ? (
        <ButtonLink href={`${base}/rooms`} variant="secondary" className="self-start">
          ไปเพิ่มห้องในผังห้อง
        </ButtonLink>
      ) : null}
    </section>
  );
}
