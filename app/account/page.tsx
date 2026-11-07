import { Suspense } from "react";
import type { Metadata } from "next";
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
