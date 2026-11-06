"use client";

import { useState } from "react";
import { NumberField } from "@/components/base/number-field/number-field";

const baht = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });

/** Client-only demo of the Move-in Cost Calculator: rent × (months in advance + months of deposit). */
export function MoveInCostDemo() {
  const [rent, setRent] = useState(4500);
  const [advance, setAdvance] = useState(1);
  const [deposit, setDeposit] = useState(2);

  // NumberField reports NaN while the input is empty.
  const safe = (value: number) => (Number.isFinite(value) ? value : 0);
  const advanceTotal = safe(rent) * safe(advance);
  const depositTotal = safe(rent) * safe(deposit);

  return (
    <div
      data-analytics="landing_cost_demo_change"
      className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField
          label="ค่าเช่า/เดือน"
          value={rent}
          onChange={setRent}
          minValue={0}
          step={500}
          formatOptions={{ style: "currency", currency: "THB", maximumFractionDigits: 0 }}
        />
        {/* Whole months only. Fractions would also make React Aria pick the keyboard per device,
            which the server cannot know, and break hydration on phones. */}
        <NumberField
          label="ล่วงหน้า (เดือน)"
          value={advance}
          onChange={setAdvance}
          minValue={0}
          maxValue={6}
          formatOptions={{ maximumFractionDigits: 0 }}
        />
        <NumberField
          label="มัดจำ (เดือน)"
          value={deposit}
          onChange={setDeposit}
          minValue={0}
          maxValue={6}
          formatOptions={{ maximumFractionDigits: 0 }}
        />
      </div>

      <dl className="flex flex-col gap-2 border-t border-separator-border pt-4 text-body-regular">
        <div className="flex justify-between gap-4">
          <dt className="text-text-secondary">ค่าเช่าล่วงหน้า</dt>
          <dd className="text-text-primary tabular-nums">{baht.format(advanceTotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-secondary">เงินมัดจำ</dt>
          <dd className="text-text-primary tabular-nums">{baht.format(depositTotal)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 pt-2">
          <dt className="text-headline-semibold text-text-primary">จ่ายวันเข้าอยู่</dt>
          <dd aria-live="polite" className="text-title-1-semibold text-text-primary tabular-nums">
            {/* Keyed on the total so the fade replays each time it changes. */}
            <span key={advanceTotal + depositTotal} className="inline-block animate-number-fade">
              {baht.format(advanceTotal + depositTotal)}
            </span>
          </dd>
        </div>
      </dl>
      <p className="text-caption-1-regular text-text-tertiary">
        ในหน้าหอจริงจะรวมค่าธรรมเนียมอื่นที่เจ้าของหอระบุ และประมาณค่าน้ำค่าไฟรายเดือนให้ด้วย
      </p>
    </div>
  );
}
