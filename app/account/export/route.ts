import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** PDPA data copy: everything the signed-in user can read about themselves, as JSON. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const id = user.id;
  const [profile, dorms, conversations, bookings, reviews, reports, watches, roommate, verifications, notifications] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.from("dorms").select("*, room_types(*), rooms(*)").eq("owner_id", id),
    supabase.from("conversations").select("*, messages(*)").or(`tenant_id.eq.${id},owner_id.eq.${id}`),
    supabase.from("bookings").select("*").or(`tenant_id.eq.${id},owner_id.eq.${id}`),
    supabase.from("reviews").select("*").eq("tenant_id", id),
    supabase.from("reports").select("*").eq("reporter_id", id),
    supabase.from("room_type_watches").select("*").eq("user_id", id),
    supabase.from("roommate_profiles").select("*").eq("user_id", id).maybeSingle(),
    supabase.from("owner_verifications").select("*").eq("owner_id", id),
    supabase.from("notifications").select("*").eq("user_id", id),
  ]);

  const body = {
    exported_at: new Date().toISOString(),
    account: { id, email: user.email, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at },
    profile: profile.data,
    dorms: dorms.data ?? [],
    conversations: conversations.data ?? [],
    bookings: bookings.data ?? [],
    reviews: reviews.data ?? [],
    reports: reports.data ?? [],
    room_type_watches: watches.data ?? [],
    roommate_profile: roommate.data,
    owner_verifications: verifications.data ?? [],
    notifications: notifications.data ?? [],
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="dormdee-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
