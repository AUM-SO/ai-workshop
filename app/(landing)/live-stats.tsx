import { cacheLife } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/supabase/env";

/** Below this many published dorms the numbers look empty, so the section stays hidden. */
const MIN_PUBLISHED_DORMS = 20;

interface Stats {
  dorms: number;
  vacantRooms: number;
  provinces: number;
}

async function getStats(): Promise<Stats | null> {
  "use cache";
  cacheLife("hours");

  try {
    const { url, key } = supabaseEnv();
    // A cookie-less anon client: the counts are public, and cached output must not depend on a session.
    const supabase = createClient(url, key, { auth: { persistSession: false } });

    const [dorms, rooms] = await Promise.all([
      supabase.from("dorms").select("province").eq("status", "published"),
      // RLS only exposes rooms of published dorms to anon.
      supabase.from("rooms").select("id", { count: "exact", head: true }).eq("status", "vacant"),
    ]);
    if (dorms.error || rooms.error) return null;

    return {
      dorms: dorms.data.length,
      vacantRooms: rooms.count ?? 0,
      provinces: new Set(dorms.data.map((dorm) => dorm.province).filter(Boolean)).size,
    };
  } catch {
    // Supabase unreachable (for example during a CI build): hide the section rather than fail the page.
    return null;
  }
}

const number = new Intl.NumberFormat("th-TH");

export async function LiveStats() {
  const stats = await getStats();
  if (!stats || stats.dorms < MIN_PUBLISHED_DORMS) return null;

  const items = [
    { value: stats.dorms, label: "หอพักบน DormDee" },
    { value: stats.vacantRooms, label: "ห้องว่างตอนนี้" },
    { value: stats.provinces, label: "จังหวัด" },
  ];

  return (
    <section aria-label="ตัวเลขบน DormDee" className="mx-auto w-full max-w-6xl px-4">
      <dl className="grid grid-cols-3 divide-x divide-separator-border rounded-3xl border border-border-button-default bg-background-primary-default py-6">
        {items.map(({ value, label }) => (
          <div key={label} className="flex flex-col-reverse items-center gap-1 px-2 text-center">
            <dt className="text-body-regular text-text-secondary">{label}</dt>
            <dd className="text-title-1-semibold text-text-primary tabular-nums sm:text-display-4-semibold">
              {number.format(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
