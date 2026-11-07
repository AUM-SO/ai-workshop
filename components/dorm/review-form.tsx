"use client";

import { useActionState, useState, useTransition, type FormEvent } from "react";
import { Form, Radio, RadioGroup, Label } from "react-aria-components";
import { RiStarFill, RiStarLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Select, SelectItem } from "@/components/base/select/select";
import { Textarea } from "@/components/base/textarea/textarea";
import { submitReview } from "@/app/dorms/actions";
import type { FormState } from "@/lib/dorms/schemas";
import { useHydrated } from "@/lib/use-hydrated";
import { cx } from "@/utils/cx";

interface ReviewFormProps {
  dormId: string;
  /** Confirmed bookings at this dorm that have no review yet. */
  bookings: { id: string; label: string }[];
}

export function ReviewForm({ dormId, bookings }: ReviewFormProps) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(submitReview.bind(null, dormId), {});
  const [, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [bookingId, setBookingId] = useState(bookings[0]?.id);
  const hydrated = useHydrated();
  const errors = state.fieldErrors ?? {};

  if (state.ok) {
    return <p className="rounded-2xl bg-status-lime-background px-4 py-3 text-body-medium text-status-lime-text">ขอบคุณสำหรับรีวิว</p>;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };

  return (
    <Form
      onSubmit={onSubmit}
      validationErrors={errors}
      validationBehavior="aria"
      className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-sm"
    >
      <p className="text-headline-semibold text-text-primary">รีวิวหอนี้</p>
      {bookings.length > 1 ? (
        <Select name="booking_id" label="การจองที่จะรีวิว" selectedKey={bookingId} onSelectionChange={(k) => setBookingId(String(k))}>
          {bookings.map((b) => (
            <SelectItem key={b.id} id={b.id}>
              {b.label}
            </SelectItem>
          ))}
        </Select>
      ) : (
        <input type="hidden" name="booking_id" value={bookingId} />
      )}
      <RadioGroup
        name="rating"
        value={rating ? String(rating) : null}
        onChange={(v) => setRating(Number(v))}
        orientation="horizontal"
        className="flex flex-col gap-1.5"
      >
        <Label className="text-body-medium text-text-primary">คะแนน</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Radio
              key={n}
              value={String(n)}
              aria-label={`${n} ดาว`}
              className="cursor-pointer rounded-md outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-border-focus-ring"
            >
              {n <= rating ? (
                <RiStarFill className="size-7 text-status-yellow-text" aria-hidden />
              ) : (
                <RiStarLine className={cx("size-7 text-foreground-icon-quaternary")} aria-hidden />
              )}
            </Radio>
          ))}
        </div>
        {errors.rating ? <span className="text-caption-1-regular text-text-error-primary">{errors.rating}</span> : null}
      </RadioGroup>
      <Textarea name="body" label="เล่าประสบการณ์" placeholder="ห้อง เจ้าของหอ ความปลอดภัย การเดินทาง" rows={3} maxLength={1000} />
      {state.error ? (
        <p role="alert" className="text-body-regular text-text-error-primary">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="self-start" disabled={!hydrated || pending || !rating}>
        {pending ? "กำลังส่ง…" : "ส่งรีวิว"}
      </Button>
    </Form>
  );
}
