"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { RadioCard } from "@/components/base/radio/radio-card";
import { RadioGroup } from "@/components/base/radio/radio";
import { updateProfile, type ProfileResult } from "./actions";

interface ProfileFormProps {
  email: string;
  displayName: string;
  role: "tenant" | "owner" | "admin";
}

export function ProfileForm({ email, displayName, role }: ProfileFormProps) {
  const [state, action, pending] = useActionState<ProfileResult, FormData>(updateProfile, {});
  const [selectedRole, setSelectedRole] = useState(role === "admin" ? "owner" : role);

  return (
    <form action={action} className="flex flex-col gap-5">
      <Input label="อีเมล" value={email} isReadOnly isDisabled inputDir="ltr" />
      <Input name="display_name" label="ชื่อที่แสดง" defaultValue={displayName} isRequired />

      {role === "admin" ? null : (
        <div className="flex flex-col gap-2">
          <span className="text-body-medium text-text-secondary">ใช้งานในฐานะ</span>
          <input type="hidden" name="role" value={selectedRole} />
          <RadioGroup
            aria-label="ประเภทบัญชี"
            value={selectedRole}
            onChange={(value) => setSelectedRole(value as "tenant" | "owner")}
            className="flex flex-col gap-2"
          >
            <RadioCard value="tenant" title="ผู้เช่า" description="ค้นหา แชท และจองห้อง" />
            <RadioCard value="owner" title="เจ้าของหอ" description="ลงประกาศและจัดการห้องพัก" />
          </RadioGroup>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
        <span aria-live="polite" className="text-body-regular">
          {state.error ? <span className="text-text-error-primary">{state.error}</span> : null}
          {state.saved ? <span className="text-text-secondary">บันทึกแล้ว</span> : null}
        </span>
      </div>
    </form>
  );
}
