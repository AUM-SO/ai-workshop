"use client";

import { useActionState, useTransition, type FormEvent } from "react";
import { CheckboxGroup, Form, type ValidationResult } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { CheckboxCard } from "@/components/base/checkbox/checkbox-card";
import { Input } from "@/components/base/input/input";
import { RadioCard } from "@/components/base/radio/radio-card";
import { RadioGroup } from "@/components/base/radio/radio";
import { Select, SelectItem } from "@/components/base/select/select";
import { Textarea } from "@/components/base/textarea/textarea";
import { LocationPicker } from "@/components/dorm/location-picker";
import { createDorm, updateDormStep, type DormStep } from "@/app/owner/dorms/actions";
import { AMENITIES, GENDER_POLICY_LABEL, PROVINCES, type GenderPolicy } from "@/lib/dorms/options";
import type { FormState } from "@/lib/dorms/schemas";
import { useHydrated } from "@/lib/use-hydrated";

/** Shows the server's message for a field (React Aria hands it over through Form validationErrors). */
const serverError = (v: ValidationResult) => v.validationErrors[0];

export interface DormInfoValues {
  name: string;
  gender_policy: GenderPolicy;
  description: string | null;
  address: string | null;
  district: string | null;
  province: string | null;
  lat: number | null;
  lng: number | null;
  amenities: string[];
  rules: string | null;
}

interface DormInfoFormProps {
  /** Omitted while creating: the general step then creates the draft. */
  dormId?: string;
  step: DormStep;
  values?: Partial<DormInfoValues>;
}

const GENDER_DESCRIPTIONS: Record<GenderPolicy, string> = {
  mixed: "รับทั้งผู้ชายและผู้หญิง",
  female: "รับเฉพาะผู้หญิง",
  male: "รับเฉพาะผู้ชาย",
};

export function DormInfoForm({ dormId, step, values = {} }: DormInfoFormProps) {
  const action = dormId ? updateDormStep.bind(null, dormId, step) : createDorm;
  const [state, dispatch, pending] = useActionState<FormState, FormData>(action, {});
  const [, startTransition] = useTransition();
  const hydrated = useHydrated();

  // Submitting through onSubmit (not the form `action` prop) keeps what the owner typed
  // when the server returns errors; React resets uncontrolled forms after an action.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => dispatch(formData));
  };

  return (
    <Form
      onSubmit={onSubmit}
      validationErrors={state.fieldErrors}
      validationBehavior="aria"
      className="flex flex-col gap-6"
    >
      {step === "general" ? <GeneralFields values={values} /> : null}
      {step === "location" ? (
        <LocationFields values={values} locationError={state.fieldErrors?.lat} provinceError={state.fieldErrors?.province} />
      ) : null}
      {step === "details" ? <DetailsFields values={values} /> : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-separator-border pt-5">
        {dormId ? (
          <>
            <Button type="submit" name="intent" value="continue" disabled={pending || !hydrated}>
              {step === "details" ? "บันทึกและไปเพิ่มรูป" : "บันทึกและไปต่อ"}
            </Button>
            <Button type="submit" name="intent" value="save" variant="secondary" disabled={pending || !hydrated}>
              บันทึก
            </Button>
          </>
        ) : (
          <Button type="submit" disabled={pending || !hydrated}>
            สร้างหอและไปต่อ
          </Button>
        )}
        <span aria-live="polite" className="text-body-regular">
          {pending ? <span className="text-text-secondary">กำลังบันทึก…</span> : null}
          {!pending && state.error ? <span className="text-text-error-primary">{state.error}</span> : null}
          {!pending && state.message ? <span className="text-text-secondary">{state.message}</span> : null}
          {!pending && state.fieldErrors ? (
            <span className="text-text-error-primary">ตรวจข้อมูลที่ทำเครื่องหมายไว้</span>
          ) : null}
        </span>
      </div>
    </Form>
  );
}

function GeneralFields({ values }: { values: Partial<DormInfoValues> }) {
  return (
    <>
      <Input
        name="name"
        errorMessage={serverError}
        label="ชื่อหอพัก"
        placeholder="เช่น บ้านสวนเรสซิเดนซ์"
        defaultValue={values.name ?? ""}
        isRequired
        autoFocus={!values.name}
      />
      <div className="flex flex-col gap-2">
        <span className="text-body-medium text-text-secondary">ประเภทหอ</span>
        <RadioGroup
          name="gender_policy"
          aria-label="ประเภทหอ"
          defaultValue={values.gender_policy ?? "mixed"}
          className="grid gap-2 sm:grid-cols-3"
        >
          {(Object.keys(GENDER_POLICY_LABEL) as GenderPolicy[]).map((key) => (
            <RadioCard key={key} value={key} title={GENDER_POLICY_LABEL[key]} description={GENDER_DESCRIPTIONS[key]} />
          ))}
        </RadioGroup>
      </div>
      <Textarea
        name="description"
        label="รายละเอียดหอ"
        hint="เล่าจุดเด่น เช่น เดินไปมหาวิทยาลัย 5 นาที เงียบ ปลอดภัย มีร้านอาหารใกล้"
        defaultValue={values.description ?? ""}
        rows={5}
        maxLength={2000}
        showCount
      />
    </>
  );
}

function LocationFields({
  values,
  locationError,
  provinceError,
}: {
  values: Partial<DormInfoValues>;
  locationError?: string;
  provinceError?: string;
}) {
  return (
    <>
      <Input
        name="address"
        errorMessage={serverError}
        label="ที่อยู่"
        placeholder="บ้านเลขที่ ซอย ถนน แขวง/ตำบล"
        defaultValue={values.address ?? ""}
        isRequired
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="district" label="เขต/อำเภอ" defaultValue={values.district ?? ""} errorMessage={serverError} />
        <Select
          name="province"
          label="จังหวัด"
          placeholder="เลือกจังหวัด"
          defaultSelectedKey={values.province ?? undefined}
          isRequired
          triggerClassName="w-full"
          popoverClassName="max-h-80"
        >
          {PROVINCES.map((province) => (
            <SelectItem key={province} id={province} textValue={province}>
              {province}
            </SelectItem>
          ))}
        </Select>
        {provinceError ? (
          <p className="text-caption-1-regular text-text-error-primary sm:col-start-2">{provinceError}</p>
        ) : null}
      </div>
      <LocationPicker defaultLat={values.lat} defaultLng={values.lng} errorMessage={locationError} />
    </>
  );
}

function DetailsFields({ values }: { values: Partial<DormInfoValues> }) {
  return (
    <>
      <CheckboxGroup name="amenities" defaultValue={values.amenities ?? []} className="flex flex-col gap-2">
        {({ isInvalid }) => (
          <>
            <span className="text-body-medium text-text-secondary">สิ่งอำนวยความสะดวก</span>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {AMENITIES.map((amenity) => (
                <CheckboxCard key={amenity.key} value={amenity.key} title={amenity.label} />
              ))}
            </div>
            {isInvalid ? <span className="text-caption-1-regular text-text-error-primary">เลือกใหม่อีกครั้ง</span> : null}
          </>
        )}
      </CheckboxGroup>
      <Textarea
        name="rules"
        label="กฎของหอ"
        hint="เช่น ห้ามสูบบุหรี่ในห้อง ปิดประตูหอเวลา 24:00 น. ห้ามพาคนนอกค้างคืน"
        defaultValue={values.rules ?? ""}
        rows={4}
        maxLength={2000}
        showCount
      />
    </>
  );
}
