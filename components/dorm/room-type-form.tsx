"use client";

import { useActionState, useState, useTransition, type FormEvent } from "react";
import { CheckboxGroup, Form, type ValidationResult } from "react-aria-components";
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import { Button, ButtonLink } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { CheckboxCard } from "@/components/base/checkbox/checkbox-card";
import { Input } from "@/components/base/input/input";
import { NumberField } from "@/components/base/number-field/number-field";
import { RadioCard } from "@/components/base/radio/radio-card";
import { RadioGroup } from "@/components/base/radio/radio";
import { saveRoomType } from "@/app/owner/dorms/room-type-actions";
import { baht, fixedMonthly, moveInTotal, type OtherFee } from "@/lib/dorms/costs";
import { FURNITURE } from "@/lib/dorms/options";
import type { FormState } from "@/lib/dorms/schemas";
import { useHydrated } from "@/lib/use-hydrated";

export interface RoomTypeValues {
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
}

interface RoomTypeFormProps {
  dormId: string;
  roomTypeId?: string;
  values?: RoomTypeValues;
}

const THB = { style: "currency", currency: "THB", maximumFractionDigits: 0 } as const;
const RATE = { style: "currency", currency: "THB", maximumFractionDigits: 2 } as const;
const serverError = (v: ValidationResult) => v.validationErrors[0];

type FeeRow = { key: number; label: string; amount: number; monthly: boolean };

export function RoomTypeForm({ dormId, roomTypeId, values }: RoomTypeFormProps) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(
    saveRoomType.bind(null, dormId, roomTypeId ?? null),
    {},
  );
  const [, startTransition] = useTransition();
  const hydrated = useHydrated();
  const errors = state.fieldErrors ?? {};

  // Controlled so the move-in summary updates as the owner types.
  const [price, setPrice] = useState(values?.monthly_price ?? NaN);
  const [deposit, setDeposit] = useState(values?.deposit ?? NaN);
  const [advance, setAdvance] = useState(values?.advance_months ?? 1);
  const [waterMode, setWaterMode] = useState<"metered" | "flat">(values?.water_flat != null ? "flat" : "metered");
  const [fees, setFees] = useState<FeeRow[]>(
    (values?.other_fees ?? []).map((fee, key) => ({ key, ...fee })),
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };

  const num = (v: number) => (Number.isFinite(v) ? v : 0);
  const costs = {
    monthly_price: num(price),
    deposit: num(deposit),
    advance_months: num(advance),
    other_fees: fees.map((f) => ({ ...f, amount: num(f.amount) })),
  };

  return (
    <Form onSubmit={onSubmit} validationErrors={errors} validationBehavior="aria" className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-headline-semibold text-text-primary">ข้อมูลห้อง</legend>
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Input
            name="name"
            label="ชื่อประเภทห้อง"
            placeholder="เช่น สตูดิโอ, ห้องพัดลม, ห้องแอร์ใหญ่"
            defaultValue={values?.name ?? ""}
            isRequired
            errorMessage={serverError}
          />
          <NumberField
            name="size_sqm"
            label="ขนาด (ตร.ม.)"
            defaultValue={values?.size_sqm ?? undefined}
            minValue={1}
            formatOptions={{ maximumFractionDigits: 1 }}
            hint={errors.size_sqm}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-headline-semibold text-text-primary">ค่าเช่าและเงินที่ต้องจ่าย</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            name="monthly_price"
            label="ค่าเช่าต่อเดือน"
            value={price}
            onChange={setPrice}
            minValue={0}
            step={100}
            formatOptions={THB}
            isRequired
            hint={errors.monthly_price}
          />
          <NumberField
            name="deposit"
            label="เงินมัดจำ"
            value={deposit}
            onChange={setDeposit}
            minValue={0}
            step={500}
            formatOptions={THB}
            hint={errors.deposit ?? "จำนวนเงิน ไม่ใช่จำนวนเดือน"}
          />
          <NumberField
            name="advance_months"
            label="ค่าเช่าล่วงหน้า (เดือน)"
            value={advance}
            onChange={setAdvance}
            minValue={0}
            maxValue={12}
            formatOptions={{ maximumFractionDigits: 0 }}
            hint={errors.advance_months}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-headline-semibold text-text-primary">ค่าน้ำค่าไฟ</legend>
        <RadioGroup
          name="water_mode"
          aria-label="วิธีคิดค่าน้ำ"
          value={waterMode}
          onChange={(v) => setWaterMode(v as "metered" | "flat")}
          className="grid gap-2 sm:grid-cols-2"
        >
          <RadioCard value="metered" title="ค่าน้ำตามมิเตอร์" description="คิดเป็นบาทต่อหน่วย" />
          <RadioCard value="flat" title="ค่าน้ำเหมาจ่าย" description="คิดเป็นบาทต่อเดือน" />
        </RadioGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          {waterMode === "metered" ? (
            <NumberField
              key="water_rate"
              name="water_rate"
              label="ค่าน้ำต่อหน่วย"
              defaultValue={values?.water_rate ?? undefined}
              minValue={0}
              formatOptions={RATE}
              isRequired
              hint={errors.water_rate}
            />
          ) : (
            <NumberField
              key="water_flat"
              name="water_flat"
              label="ค่าน้ำต่อเดือน"
              defaultValue={values?.water_flat ?? undefined}
              minValue={0}
              formatOptions={THB}
              isRequired
              hint={errors.water_flat}
            />
          )}
          <NumberField
            name="electric_rate"
            label="ค่าไฟต่อหน่วย"
            defaultValue={values?.electric_rate ?? undefined}
            minValue={0}
            formatOptions={RATE}
            hint={errors.electric_rate ?? "เว้นว่างถ้าคิดตามการไฟฟ้า"}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-headline-semibold text-text-primary">ค่าใช้จ่ายอื่น</legend>
        <p className="text-body-regular text-text-secondary">
          เช่น ค่าส่วนกลาง ค่าอินเทอร์เน็ต ค่าทำความสะอาดตอนย้ายออก ผู้เช่าจะเห็นรายการนี้ก่อนจอง
        </p>
        {fees.map((fee, index) => (
          <div
            key={fee.key}
            className="grid items-end gap-3 rounded-2xl border border-border-button-default p-3 sm:grid-cols-[2fr_1fr_auto_auto]"
          >
            <Input
              name={`other_fees.${index}.label`}
              label="รายการ"
              value={fee.label}
              onChange={(label) => setFees((list) => list.map((f) => (f.key === fee.key ? { ...f, label } : f)))}
              errorMessage={serverError}
            />
            <NumberField
              name={`other_fees.${index}.amount`}
              label="จำนวนเงิน"
              value={fee.amount}
              onChange={(amount) => setFees((list) => list.map((f) => (f.key === fee.key ? { ...f, amount } : f)))}
              minValue={0}
              formatOptions={THB}
              hint={errors[`other_fees.${index}.amount`]}
            />
            <div className="flex h-9 items-center">
              <input type="hidden" name={`other_fees.${index}.monthly`} value={String(fee.monthly)} />
              <Checkbox
                isSelected={fee.monthly}
                onChange={(monthly) => setFees((list) => list.map((f) => (f.key === fee.key ? { ...f, monthly } : f)))}
              >
                จ่ายทุกเดือน
              </Checkbox>
            </div>
            <Button
              type="button"
              variant="ghost"
              iconOnly
              leadingIcon={RiDeleteBinLine}
              aria-label={`ลบรายการ ${fee.label || index + 1}`}
              onClick={() => setFees((list) => list.filter((f) => f.key !== fee.key))}
            />
          </div>
        ))}
        {errors.other_fees ? <p className="text-caption-1-regular text-text-error-primary">{errors.other_fees}</p> : null}
        <Button
          type="button"
          variant="secondary"
          size="small"
          leadingIcon={RiAddLine}
          className="self-start"
          disabled={fees.length >= 10}
          onClick={() =>
            setFees((list) => [...list, { key: Math.max(-1, ...list.map((f) => f.key)) + 1, label: "", amount: NaN, monthly: true }])
          }
        >
          เพิ่มค่าใช้จ่าย
        </Button>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-headline-semibold text-text-primary">เฟอร์นิเจอร์ในห้อง</legend>
        <CheckboxGroup
          name="furniture"
          aria-label="เฟอร์นิเจอร์ในห้อง"
          defaultValue={values?.furniture ?? []}
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FURNITURE.map((item) => (
            <CheckboxCard key={item.key} value={item.key} title={item.label} />
          ))}
        </CheckboxGroup>
      </fieldset>

      <section
        aria-label="สรุปค่าใช้จ่าย"
        className="grid gap-3 rounded-2xl bg-background-secondary-default p-4 sm:grid-cols-2"
      >
        <div className="flex flex-col">
          <span className="text-caption-1-regular text-text-tertiary">ผู้เช่าจ่ายวันเข้าอยู่</span>
          <span className="text-title-2-semibold text-text-primary tabular-nums">{baht(moveInTotal(costs))}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-caption-1-regular text-text-tertiary">รายเดือน ไม่รวมค่าน้ำค่าไฟ</span>
          <span className="text-title-2-semibold text-text-primary tabular-nums">{baht(fixedMonthly(costs))}</span>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-separator-border pt-5">
        <Button type="submit" disabled={pending || !hydrated}>
          {pending ? "กำลังบันทึก…" : roomTypeId ? "บันทึก" : "เพิ่มประเภทห้อง"}
        </Button>
        <ButtonLink href={`/owner/dorms/${dormId}/room-types`} variant="secondary">
          ยกเลิก
        </ButtonLink>
        <span aria-live="polite" className="text-body-regular text-text-error-primary">
          {!pending && (state.error ?? (state.fieldErrors ? "ตรวจข้อมูลที่ทำเครื่องหมายไว้" : null))}
        </span>
      </div>
    </Form>
  );
}
