"use client";

import { useActionState, useState, useTransition, type FormEvent } from "react";
import { Form } from "react-aria-components";
import { RiAddLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { NumberField } from "@/components/base/number-field/number-field";
import { Select, SelectItem } from "@/components/base/select/select";
import { addRooms } from "@/app/owner/dorms/room-actions";
import type { FormState } from "@/lib/dorms/schemas";
import { useHydrated } from "@/lib/use-hydrated";

interface BulkRoomsFormProps {
  dormId: string;
  roomTypes: { id: string; name: string }[];
}

const WHOLE = { maximumFractionDigits: 0, useGrouping: false } as const;

/** Adds a run of room numbers on one floor, e.g. floor 2, rooms 201–210. */
export function BulkRoomsForm({ dormId, roomTypes }: BulkRoomsFormProps) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(addRooms.bind(null, dormId), {});
  const [, startTransition] = useTransition();
  const hydrated = useHydrated();
  const errors = state.fieldErrors ?? {};

  const [floor, setFloor] = useState(2);
  const [from, setFrom] = useState(201);
  const [to, setTo] = useState(210);
  const [prefix, setPrefix] = useState("");

  const count = Number.isFinite(from) && Number.isFinite(to) && to >= from ? to - from + 1 : 0;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };

  // Typing a floor suggests that floor's usual numbering (floor 3 → 301–310).
  const changeFloor = (value: number) => {
    setFloor(value);
    if (Number.isFinite(value) && value > 0 && value < 100) {
      setFrom(value * 100 + 1);
      setTo(value * 100 + 10);
    }
  };

  return (
    <Form onSubmit={onSubmit} validationErrors={errors} validationBehavior="aria" className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          name="room_type_id"
          label="ประเภทห้อง"
          placeholder="เลือกประเภทห้อง"
          defaultSelectedKey={roomTypes.length === 1 ? roomTypes[0].id : undefined}
          isRequired
          className="sm:col-span-2 lg:col-span-4 lg:max-w-sm"
          triggerClassName="w-full"
        >
          {roomTypes.map((type) => (
            <SelectItem key={type.id} id={type.id} textValue={type.name}>
              {type.name}
            </SelectItem>
          ))}
        </Select>
        <NumberField name="floor" label="ชั้น" value={floor} onChange={changeFloor} minValue={-5} maxValue={200} formatOptions={WHOLE} hint={errors.floor} />
        <Input
          name="prefix"
          label="อักษรนำหน้า"
          value={prefix}
          onChange={setPrefix}
          placeholder="เช่น A"
          maxLength={5}
          hint="ไม่บังคับ"
        />
        <NumberField name="from" label="เลขห้องแรก" value={from} onChange={setFrom} minValue={0} formatOptions={WHOLE} hint={errors.from} />
        <NumberField name="to" label="เลขห้องสุดท้าย" value={to} onChange={setTo} minValue={0} formatOptions={WHOLE} hint={errors.to} />
      </div>
      {errors.room_type_id ? <p className="text-caption-1-regular text-text-error-primary">{errors.room_type_id}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" leadingIcon={RiAddLine} disabled={pending || !hydrated || count === 0 || count > 100}>
          {pending ? "กำลังเพิ่ม…" : count > 0 ? `เพิ่ม ${count} ห้อง` : "เพิ่มห้อง"}
        </Button>
        <span className="text-body-regular text-text-secondary">
          {count > 100
            ? "เพิ่มได้ครั้งละไม่เกิน 100 ห้อง"
            : count > 0
              ? `ห้อง ${prefix}${from}${count > 1 ? `–${prefix}${to}` : ""} ชั้น ${floor}`
              : null}
        </span>
        <span aria-live="polite" className="text-body-regular">
          {!pending && state.error ? <span className="text-text-error-primary">{state.error}</span> : null}
          {!pending && state.message ? <span className="text-text-secondary">{state.message}</span> : null}
        </span>
      </div>
    </Form>
  );
}
