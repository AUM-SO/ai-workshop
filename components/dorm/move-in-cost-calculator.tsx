"use client";

import { useState } from "react";
import { NumberField } from "@/components/base/number-field/number-field";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";
import {
  UTILITY_ELECTRIC_FALLBACK,
  baht,
  monthlyEstimate,
  type RoomTypeCosts,
  type UtilityRates,
} from "@/lib/dorms/costs";

export interface CalculatorRoomType extends RoomTypeCosts, UtilityRates {
  id: string;
  name: string;
}

const WHOLE = { maximumFractionDigits: 0 } as const;

/**
 * Move-in Cost Calculator: what the tenant pays on move-in day, and a monthly
 * estimate with water and electricity for the usage they expect.
 */
export function MoveInCostCalculator({ roomTypes }: { roomTypes: CalculatorRoomType[] }) {
  const [typeId, setTypeId] = useState(roomTypes[0]?.id);
  // Typical single-room usage; the tenant adjusts both.
  const [waterUnits, setWaterUnits] = useState(5);
  const [electricUnits, setElectricUnits] = useState(150);

  const type = roomTypes.find((t) => t.id === typeId) ?? roomTypes[0];
  if (!type) return null;

  const safe = (v: number) => (Number.isFinite(v) ? Math.max(v, 0) : 0);
  const advance = type.monthly_price * type.advance_months;
  const oneOff = type.other_fees.filter((f) => !f.monthly);
  const moveIn = advance + type.deposit + oneOff.reduce((sum, f) => sum + f.amount, 0);
  const monthly = monthlyEstimate(type, safe(waterUnits), safe(electricUnits));

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-md sm:p-6">
      {roomTypes.length > 1 ? (
        <SegmentedControl
          aria-label="เลือกประเภทห้อง"
          selectedKeys={[type.id]}
          onSelectionChange={(keys) => {
            const [next] = [...keys];
            if (next) setTypeId(String(next));
          }}
          className="self-start"
        >
          {roomTypes.map((t) => (
            <SegmentedControlItem key={t.id} id={t.id}>
              {t.name}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="move-in-title" className="flex flex-col gap-3">
          <h3 id="move-in-title" className="text-headline-semibold text-text-primary">
            จ่ายวันเข้าอยู่
          </h3>
          <dl className="flex flex-col gap-2 text-body-regular">
            <Row label={`ค่าเช่าล่วงหน้า ${type.advance_months} เดือน`} value={baht(advance)} />
            <Row label="เงินมัดจำ" value={baht(type.deposit)} />
            {oneOff.map((fee) => (
              <Row key={fee.label} label={fee.label} value={baht(fee.amount)} />
            ))}
            <Row label="รวม" value={baht(moveIn)} total />
          </dl>
        </section>

        <section aria-labelledby="monthly-title" className="flex flex-col gap-3">
          <h3 id="monthly-title" className="text-headline-semibold text-text-primary">
            ค่าใช้จ่ายต่อเดือนโดยประมาณ
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {type.water_flat == null ? (
              <NumberField
                label="ใช้น้ำ (หน่วย)"
                value={waterUnits}
                onChange={setWaterUnits}
                minValue={0}
                maxValue={200}
                formatOptions={WHOLE}
                size="small"
              />
            ) : null}
            <NumberField
              label="ใช้ไฟ (หน่วย)"
              value={electricUnits}
              onChange={setElectricUnits}
              minValue={0}
              maxValue={2000}
              step={10}
              formatOptions={WHOLE}
              size="small"
            />
          </div>
          <dl className="flex flex-col gap-2 text-body-regular">
            <Row label="ค่าเช่าและค่าบริการรายเดือน" value={baht(monthly.fixed)} />
            <Row label={type.water_flat != null ? "ค่าน้ำเหมาจ่าย" : `ค่าน้ำ (${type.water_rate ?? 0} บาท/หน่วย)`} value={baht(monthly.water)} />
            <Row
              label={`ค่าไฟ (${type.electric_rate ?? UTILITY_ELECTRIC_FALLBACK} บาท/หน่วย${type.electric_rate == null ? " โดยประมาณ" : ""})`}
              value={baht(monthly.electric)}
            />
            <Row label="รวมต่อเดือน" value={baht(monthly.total)} total live />
          </dl>
        </section>
      </div>
      <p className="text-caption-1-regular text-text-tertiary">
        ตัวเลขค่าน้ำค่าไฟเป็นค่าประมาณจากหน่วยที่ใส่ ยอดจริงขึ้นอยู่กับการใช้งาน ห้องเดี่ยวทั่วไปใช้ไฟประมาณ 100–200 หน่วยต่อเดือน
      </p>
    </div>
  );
}

function Row({ label, value, total, live }: { label: string; value: string; total?: boolean; live?: boolean }) {
  return (
    <div className={total ? "flex items-baseline justify-between gap-4 border-t border-separator-border pt-2" : "flex justify-between gap-4"}>
      <dt className={total ? "text-body-medium text-text-primary" : "text-text-secondary"}>{label}</dt>
      <dd
        aria-live={live ? "polite" : undefined}
        className={total ? "text-title-2-semibold text-text-primary tabular-nums" : "text-text-primary tabular-nums"}
      >
        {value}
      </dd>
    </div>
  );
}
