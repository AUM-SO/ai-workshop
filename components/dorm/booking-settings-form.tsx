"use client";

import { useActionState, useTransition, type FormEvent } from "react";
import { Form } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Switch } from "@/components/base/switch/switch";
import { updateBookingSettings } from "@/app/owner/dorms/settings-actions";
import type { FormState } from "@/lib/dorms/schemas";
import { useHydrated } from "@/lib/use-hydrated";

interface BookingSettingsFormProps {
  dormId: string;
  promptpayId: string | null;
  aiReplyEnabled: boolean;
  /** False when ANTHROPIC_API_KEY or SUPABASE_SECRET_KEY is missing. */
  aiAvailable: boolean;
}

export function BookingSettingsForm({ dormId, promptpayId, aiReplyEnabled, aiAvailable }: BookingSettingsFormProps) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(updateBookingSettings.bind(null, dormId), {});
  const [, startTransition] = useTransition();
  const hydrated = useHydrated();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };

  return (
    <Form onSubmit={onSubmit} validationErrors={state.fieldErrors ?? {}} validationBehavior="aria" className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-sm">
        <h2 className="text-headline-semibold text-text-primary">รับเงินมัดจำผ่าน PromptPay</h2>
        <p className="text-body-regular text-text-secondary">
          เมื่อคุณกันห้องหรือยืนยันการจองแล้ว ผู้เช่าจะเห็น QR PromptPay พร้อมยอดเงินมัดจำในแชท และแนบสลิปให้คุณตรวจสอบได้ เว้นว่างไว้ถ้าไม่ต้องการ
        </p>
        <Input
          name="promptpay_id"
          label="หมายเลข PromptPay"
          placeholder="เบอร์มือถือ หรือเลขบัตรประชาชน 13 หลัก"
          defaultValue={promptpayId ?? ""}
          inputMode="numeric"
          className="max-w-sm"
        />
      </section>

      <section className="flex flex-col gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-sm">
        <h2 className="text-headline-semibold text-text-primary">ผู้ช่วย AI ตอบแชท</h2>
        <p className="text-body-regular text-text-secondary">
          เมื่อคุณยังไม่ได้เปิดอ่านแชท ผู้ช่วยจะตอบคำถามทั่วไปจากข้อมูลหอ เช่น ราคา ค่าน้ำไฟ ห้องว่าง สิ่งอำนวยความสะดวก และบอกให้รอคุณเมื่อเป็นเรื่องการจองหรือต่อรอง
          ข้อความจาก AI จะมีป้ายกำกับให้ผู้เช่าเห็น
        </p>
        <Switch name="ai_reply_enabled" defaultSelected={aiReplyEnabled} isDisabled={!aiAvailable}>
          เปิดผู้ช่วย AI
        </Switch>
        {!aiAvailable ? <p className="text-caption-1-regular text-text-tertiary">ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY และ SUPABASE_SECRET_KEY บนเซิร์ฟเวอร์</p> : null}
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!hydrated || pending}>
          {pending ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
        {state.error ? (
          <p role="alert" className="text-body-regular text-text-error-primary">
            {state.error}
          </p>
        ) : state.ok ? (
          <p role="status" className="text-body-regular text-text-secondary">
            {state.message}
          </p>
        ) : null}
      </div>
    </Form>
  );
}
