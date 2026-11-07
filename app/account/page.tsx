import { Suspense } from "react";
import type { Metadata } from "next";
import { AccountPrivacy } from "@/components/account/account-privacy";
import { LineConnect } from "@/components/account/line-connect";
import { requireProfile } from "@/lib/auth";
import { lineConfig } from "@/lib/line";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "บัญชีของฉัน" };

export default function AccountPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12">
      <h1 className="text-title-2-medium text-text-primary">บัญชีของฉัน</h1>
      <div className="rounded-3xl border border-border-button-default bg-background-primary-default p-6">
        <Suspense fallback={<p className="text-body-regular text-text-secondary">กำลังโหลด…</p>}>
          <AccountForm />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <LineSection />
      </Suspense>
      <Suspense fallback={null}>
        <PrivacySection />
      </Suspense>
    </div>
  );
}

async function AccountForm() {
  const profile = await requireProfile("/account");
  return (
    <ProfileForm email={profile.email} displayName={profile.display_name ?? ""} role={profile.role} />
  );
}

async function LineSection() {
  const config = lineConfig();
  if (!config) return null;
  const profile = await requireProfile("/account");
  const supabase = await createClient();
  const { data } = await supabase.from("line_links").select("line_user_id").eq("user_id", profile.id).maybeSingle();
  return (
    <div className="rounded-3xl border border-border-button-default bg-background-primary-default p-6">
      <LineConnect linked={Boolean(data?.line_user_id)} botId={config.botId} />
    </div>
  );
}

async function PrivacySection() {
  const profile = await requireProfile("/account");
  const supabase = await createClient();
  const [{ count: published }, { count: open }] = await Promise.all([
    supabase.from("dorms").select("id", { count: "exact", head: true }).eq("owner_id", profile.id).eq("status", "published"),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .or(`owner_id.eq.${profile.id},tenant_id.eq.${profile.id}`)
      .in("status", ["pending", "held"]),
  ]);
  const blockers = [
    published ? `ปิดประกาศหอที่เผยแพร่อยู่ ${published} หอ (ที่หน้าหอพักของฉัน)` : null,
    open ? `ปิดหรือยกเลิกคำขอจองที่ยังค้าง ${open} รายการ (ในแชท)` : null,
  ].filter((b): b is string => Boolean(b));
  return (
    <div className="rounded-3xl border border-border-button-default bg-background-primary-default p-6">
      <AccountPrivacy blockers={blockers} />
    </div>
  );
}
