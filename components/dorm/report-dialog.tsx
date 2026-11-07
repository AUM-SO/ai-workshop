"use client";

import { useActionState, useState, useTransition, type FormEvent } from "react";
import { Form } from "react-aria-components";
import { RiFlag2Line } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTrigger } from "@/components/base/modal/modal";
import { Select, SelectItem } from "@/components/base/select/select";
import { Textarea } from "@/components/base/textarea/textarea";
import { reportDorm } from "@/app/dorms/actions";
import type { FormState } from "@/lib/dorms/schemas";
import { REPORT_REASONS } from "@/lib/dorms/trust";

export function ReportDialog({ dormId }: { dormId: string }) {
  const [open, setOpen] = useState(false);
  const [state, dispatch, pending] = useActionState<FormState, FormData>(reportDorm.bind(null, dormId), {});
  const [, startTransition] = useTransition();
  const errors = state.fieldErrors ?? {};

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };

  return (
    <ModalTrigger isOpen={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="small" leadingIcon={RiFlag2Line} className="self-start">
        รายงานประกาศนี้
      </Button>
      <Modal size="md">
        {state.ok ? (
          <>
            <ModalHeader title="ส่งรายงานแล้ว" description={state.message} />
            <ModalFooter>
              <Button onClick={() => setOpen(false)}>ปิด</Button>
            </ModalFooter>
          </>
        ) : (
          <Form onSubmit={onSubmit} validationErrors={errors} validationBehavior="aria" className="contents">
            <ModalHeader title="รายงานประกาศ" description="แจ้งทีมงานเมื่อเจอประกาศที่น่าสงสัยหรือข้อมูลไม่ตรง" />
            <ModalBody className="flex flex-col gap-4">
              <Select name="reason" label="เหตุผล" placeholder="เลือกเหตุผล" isRequired triggerClassName="w-full">
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.key} id={r.key}>
                    {r.label}
                  </SelectItem>
                ))}
              </Select>
              {errors.reason ? <span className="-mt-3 text-caption-1-regular text-text-error-primary">{errors.reason}</span> : null}
              <Textarea name="details" label="รายละเอียด (ถ้ามี)" placeholder="เช่น เจ้าของขอให้โอนมัดจำก่อนดูห้อง" rows={3} maxLength={1000} />
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
              <Button type="submit" disabled={pending}>
                {pending ? "กำลังส่ง…" : "ส่งรายงาน"}
              </Button>
            </ModalFooter>
          </Form>
        )}
      </Modal>
    </ModalTrigger>
  );
}
