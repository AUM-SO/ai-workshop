import { RiFlag2Line, RiNotification3Line } from "@remixicon/react";
import { ButtonLink } from "@/components/base/buttons/button";
import { ReportDialog } from "@/components/dorm/report-dialog";
import { ReviewForm } from "@/components/dorm/review-form";
import { WatchButton } from "@/components/dorm/watch-button";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Per-visitor pieces of the public dorm page. Each one streams in under its own
// <Suspense>, so the cached page around them stays the same for everyone.

const loginHref = (dormId: string) => `/login?next=${encodeURIComponent(`/dorms/${dormId}`)}`;
const monthYear = new Intl.DateTimeFormat("th-TH", { month: "short", year: "numeric" });

export async function WatchSlot({ dormId, roomTypeId }: { dormId: string; roomTypeId: string }) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return (
      <ButtonLink href={loginHref(dormId)} variant="secondary" leadingIcon={RiNotification3Line} className="w-full">
        เข้าสู่ระบบเพื่อรับแจ้งเตือนห้องว่าง
      </ButtonLink>
    );
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("room_type_watches")
    .select("room_type_id")
    .eq("user_id", profile.id)
    .eq("room_type_id", roomTypeId)
    .maybeSingle();
  return <WatchButton dormId={dormId} roomTypeId={roomTypeId} initialWatching={Boolean(data)} />;
}

export async function ReviewComposer({ dormId }: { dormId: string }) {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const [{ data: bookings }, { data: reviewed }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, move_in_date")
      .eq("dorm_id", dormId)
      .eq("tenant_id", profile.id)
      .eq("status", "confirmed")
      .order("move_in_date", { ascending: false }),
    supabase.from("reviews").select("booking_id").eq("dorm_id", dormId).eq("tenant_id", profile.id),
  ]);
  const done = new Set((reviewed ?? []).map((r) => r.booking_id));
  const open = (bookings ?? []).filter((b) => !done.has(b.id));
  if (!open.length) return null;
  return (
    <ReviewForm
      dormId={dormId}
      bookings={open.map((b) => ({ id: b.id, label: `เข้าอยู่ ${monthYear.format(new Date(b.move_in_date))}` }))}
    />
  );
}

export async function ReportSlot({ dormId }: { dormId: string }) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return (
      <ButtonLink href={loginHref(dormId)} variant="ghost" size="small" leadingIcon={RiFlag2Line} className="self-start">
        รายงานประกาศนี้
      </ButtonLink>
    );
  }
  return <ReportDialog dormId={dormId} />;
}
