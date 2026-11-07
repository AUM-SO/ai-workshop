"use client";

import { useActionState, useState, useTransition, type FormEvent } from "react";
import { CalendarDate, today } from "@internationalized/date";
import { Form } from "react-aria-components";
import { RiCalendarCheckLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { DatePicker } from "@/components/base/date-picker/date-picker";
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTrigger } from "@/components/base/modal/modal";
import { NumberField } from "@/components/base/number-field/number-field";
import { Select, SelectItem } from "@/components/base/select/select";
import { Textarea } from "@/components/base/textarea/textarea";
import { requestBooking } from "@/app/chat/actions";
import { baht } from "@/lib/dorms/costs";
import type { FormState } from "@/lib/dorms/schemas";

interface BookingRequestDialogProps {
  conversationId: string;
  roomTypes: { id: string; name: string; monthly_price: number }[];
  /** Opens straight away with this type chosen (from "ขอจอง" on the dorm page). */
  initialTypeId?: string;
  disabled?: boolean;
}

export function BookingRequestDialog({ conversationId, roomTypes, initialTypeId, disabled }: BookingRequestDialogProps) {
  const [open, setOpen] = useState(Boolean(initialTypeId) && !disabled);
  const [state, dispatch, pending] = useActionState<FormState, FormData>(requestBooking.bind(null, conversationId), {});
  const [, startTransition] = useTransition();
  const [typeId, setTypeId] = useState(initialTypeId ?? roomTypes[0]?.id);
  const [moveIn, setMoveIn] = useState<CalendarDate | null>(today("Asia/Bangkok").add({ days: 7 }));
  const [months, setMonths] = useState(12);
  const errors = state.fieldErrors ?? {};

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      dispatch(formData);
    });
  };

  // Close once the request went through (the card appears in the chat).
  if (open && state.ok && !pending) queueMicrotask(() => setOpen(false));

  return (
    <ModalTrigger isOpen={open} onOpenChange={setOpen}>
      <Button variant="secondary" size="small" leadingIcon={RiCalendarCheckLine} disabled={disabled}>
        ขอจองห้อง
      </Button>
      <Modal size="md">
        <Form onSubmit={onSubmit} validationErrors={errors} validationBehavior="aria" className="contents">
          <ModalHeader title="ส่งคำขอจอง" description="เจ้าของหอจะตอบรับ กันห้องไว้ให้ หรือปฏิเสธในแชทนี้" />
          <ModalBody className="flex flex-col gap-4">
            <Select
              name="room_type_id"
              label="ประเภทห้อง"
              selectedKey={typeId}
              onSelectionChange={(k) => setTypeId(String(k))}
              triggerClassName="w-full"
            >
              {roomTypes.map((t) => (
                <SelectItem key={t.id} id={t.id} textValue={t.name}>
                  {t.name} · {baht(t.monthly_price)}/เดือน
                </SelectItem>
              ))}
            </Select>
            <div className="flex flex-col gap-1">
              <span className="text-body-medium text-text-secondary">วันที่จะเข้าอยู่</span>
              <DatePicker aria-label="วันที่จะเข้าอยู่" value={moveIn} onChange={setMoveIn} />
              <input type="hidden" name="move_in" value={moveIn?.toString() ?? ""} />
              {errors.move_in ? <span className="text-caption-1-regular text-text-error-primary">{errors.move_in}</span> : null}
            </div>
            <NumberField
              name="months"
              label="ระยะสัญญา (เดือน)"
              value={months}
              onChange={setMonths}
              minValue={1}
              maxValue={60}
              formatOptions={{ maximumFractionDigits: 0 }}
              hint={errors.months}
            />
            <Textarea name="note" label="ข้อความถึงเจ้าของหอ" placeholder="เช่น อยากได้ห้องชั้นบน ขอดูห้องก่อนวันเสาร์" rows={3} maxLength={500} />
            {state.error ? (
              <p role="alert" className="text-body-regular text-text-error-primary">
                {state.error}
              </p>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={pending || !moveIn || !typeId}>
              {pending ? "กำลังส่ง…" : "ส่งคำขอจอง"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </ModalTrigger>
  );
}
