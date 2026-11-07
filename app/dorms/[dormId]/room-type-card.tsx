import { Chip } from "@/components/base/badges/chip";
import { StartChatButton } from "@/components/chat/start-chat-button";
import { baht, fixedMonthly, moveInTotal, type OtherFee } from "@/lib/dorms/costs";
import { FURNITURE } from "@/lib/dorms/options";

const furnitureLabel = new Map<string, string>(FURNITURE.map((f) => [f.key, f.label]));

export interface RoomTypeSummary {
  id: string;
  name: string;
  size_sqm: number | null;
  monthly_price: number;
  deposit: number;
  advance_months: number;
  water_rate: number | null;
  water_flat: number | null;
  electric_rate: number | null;
  furniture: string[];
  other_fees: OtherFee[];
  totalRooms: number;
}

export function RoomTypeCard({ dormId, type, vacant }: { dormId: string; type: RoomTypeSummary; vacant: number }) {
  return (
    <article
      aria-labelledby={`type-${type.id}`}
      className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-sm"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 id={`type-${type.id}`} className="text-headline-semibold text-text-primary">
            {type.name}
          </h3>
          {type.size_sqm ? <p className="text-caption-1-regular text-text-tertiary">{type.size_sqm} ตร.ม.</p> : null}
        </div>
        <Chip color={vacant > 0 ? "lime" : "neutral"} variant="caption">
          {vacant > 0 ? `ว่าง ${vacant} ห้อง` : "เต็ม"}
        </Chip>
      </header>

      <p className="flex items-baseline gap-1">
        <span className="text-title-1-semibold text-text-primary tabular-nums">{baht(type.monthly_price)}</span>
        <span className="text-body-regular text-text-secondary">/เดือน</span>
      </p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-body-regular">
        <dt className="text-text-secondary">เงินมัดจำ</dt>
        <dd className="text-end text-text-primary tabular-nums">{baht(type.deposit)}</dd>
        <dt className="text-text-secondary">จ่ายล่วงหน้า</dt>
        <dd className="text-end text-text-primary">{type.advance_months} เดือน</dd>
        <dt className="text-text-secondary">ค่าน้ำ</dt>
        <dd className="text-end text-text-primary">
          {type.water_flat != null ? `${baht(type.water_flat)}/เดือน` : `${type.water_rate ?? "-"} บาท/หน่วย`}
        </dd>
        <dt className="text-text-secondary">ค่าไฟ</dt>
        <dd className="text-end text-text-primary">
          {type.electric_rate != null ? `${type.electric_rate} บาท/หน่วย` : "ตามการไฟฟ้า"}
        </dd>
        {type.other_fees.map((fee) => (
          <div key={fee.label} className="contents">
            <dt className="text-text-secondary">{fee.label}</dt>
            <dd className="text-end text-text-primary tabular-nums">
              {baht(fee.amount)}
              {fee.monthly ? "/เดือน" : " (ครั้งเดียว)"}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-background-secondary-default p-3">
        <div className="flex flex-col">
          <span className="text-caption-1-regular text-text-tertiary">จ่ายวันเข้าอยู่</span>
          <span className="text-headline-semibold text-text-primary tabular-nums">{baht(moveInTotal(type))}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-caption-1-regular text-text-tertiary">รายเดือน ไม่รวมน้ำไฟ</span>
          <span className="text-headline-semibold text-text-primary tabular-nums">{baht(fixedMonthly(type))}</span>
        </div>
      </div>

      {type.furniture.length ? (
        <p className="text-caption-1-regular text-text-secondary">
          เฟอร์นิเจอร์: {type.furniture.map((key) => furnitureLabel.get(key) ?? key).join(" · ")}
        </p>
      ) : null}
      {vacant > 0 ? (
        <StartChatButton dormId={dormId} roomTypeId={type.id} variant="secondary">
          ขอจองห้องแบบนี้
        </StartChatButton>
      ) : null}
    </article>
  );
}
