"use client";

import { useActionState, useTransition, type FormEvent } from "react";
import { Form } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { NumberField } from "@/components/base/number-field/number-field";
import { Select, SelectItem } from "@/components/base/select/select";
import { Switch } from "@/components/base/switch/switch";
import { Textarea } from "@/components/base/textarea/textarea";
import { saveRoommateProfile } from "@/app/roommates/actions";
import { PROVINCES } from "@/lib/dorms/options";
import type { FormState } from "@/lib/dorms/schemas";
import { CLEANLINESS, GENDER, GUESTS, SLEEP, type RoommateProfile } from "@/lib/roommates";
import { useHydrated } from "@/lib/use-hydrated";

const THB = { style: "currency", currency: "THB", maximumFractionDigits: 0 } as const;

function Choice<T extends Record<string | number, string>>({
  name,
  label,
  options,
  value,
}: {
  name: string;
  label: string;
  options: T;
  value?: string;
}) {
  return (
    <Select name={name} label={label} placeholder="เลือก" defaultSelectedKey={value} isRequired triggerClassName="w-full">
      {Object.entries(options).map(([key, text]) => (
        <SelectItem key={key} id={key} textValue={text}>
          {text}
        </SelectItem>
      ))}
    </Select>
  );
}

export function RoommateForm({ profile }: { profile: RoommateProfile | null }) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(saveRoommateProfile, {});
  const [, startTransition] = useTransition();
  const hydrated = useHydrated();
  const errors = state.fieldErrors ?? {};

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };

  return (
    <Form onSubmit={onSubmit} validationErrors={errors} validationBehavior="aria" className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select name="province" label="จังหวัดที่จะหาหอ" placeholder="เลือกจังหวัด" defaultSelectedKey={profile?.province} isRequired triggerClassName="w-full">
          {PROVINCES.map((p) => (
            <SelectItem key={p} id={p} textValue={p}>
              {p}
            </SelectItem>
          ))}
        </Select>
        <NumberField
          name="budget_max"
          label="งบค่าห้องต่อคนต่อเดือน (สูงสุด)"
          defaultValue={profile?.budget_max ?? 4000}
          minValue={1000}
          maxValue={100000}
          step={500}
          formatOptions={THB}
          hint={errors.budget_max}
        />
        <Choice name="gender" label="เพศ" options={GENDER} value={profile?.gender} />
        <Choice name="sleep" label="เวลานอน" options={SLEEP} value={profile?.sleep} />
        <Choice name="cleanliness" label="ความเรียบร้อย" options={CLEANLINESS} value={profile ? String(profile.cleanliness) : undefined} />
        <Choice name="guests" label="การพาเพื่อนมาห้อง" options={GUESTS} value={profile?.guests} />
      </div>
      <div className="flex flex-col gap-2">
        <Switch name="prefer_same_gender" defaultSelected={profile?.prefer_same_gender ?? true}>
          อยากได้รูมเมทเพศเดียวกัน
        </Switch>
        <Switch name="smoking" defaultSelected={profile?.smoking ?? false}>
          สูบบุหรี่
        </Switch>
        <Switch name="pets" defaultSelected={profile?.pets ?? false}>
          มีหรืออยากเลี้ยงสัตว์
        </Switch>
      </div>
      <Textarea name="bio" label="แนะนำตัว" placeholder="เรียน/ทำงานที่ไหน งานอดิเรก สิ่งที่อยากได้จากรูมเมท" defaultValue={profile?.bio ?? ""} rows={3} maxLength={500} />
      <Input
        name="contact"
        label="ช่องทางติดต่อ (แสดงให้คนที่เข้ากันได้เห็น)"
        placeholder="เช่น LINE ID หรือ IG"
        defaultValue={profile?.contact ?? ""}
        maxLength={100}
      />
      <Switch name="active" defaultSelected={profile?.active ?? true}>
        แสดงโปรไฟล์ให้คนอื่นเห็น
      </Switch>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!hydrated || pending}>
          {pending ? "กำลังบันทึก…" : profile ? "บันทึก" : "สร้างโปรไฟล์และหาคู่"}
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
