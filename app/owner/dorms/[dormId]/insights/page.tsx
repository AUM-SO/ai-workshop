import { Suspense } from "react";
import type { Metadata } from "next";
import { baht } from "@/lib/dorms/costs";
import { getOwnedDorm } from "@/lib/dorms/owner";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "สถิติหอพัก" };

const dayLabel = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" });
const percent = (n: number) => `${Math.round(n * 100)}%`;

export default function DormInsightsPage(props: PageProps<"/owner/dorms/[dormId]/insights">) {
  return (
    <Suspense fallback={<p className="text-body-regular text-text-secondary">กำลังโหลด…</p>}>
      <Insights {...props} />
    </Suspense>
  );
}

/** YYYY-MM-DD of a date in Bangkok time. */
const bangkokDay = (date: Date) => new Date(date.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);

async function Insights({ params }: PageProps<"/owner/dorms/[dormId]/insights">) {
  const { dormId } = await params;
  const dorm = await getOwnedDorm(dormId);
  const supabase = await createClient();

  const now = new Date();
  const since30 = bangkokDay(new Date(now.getTime() - 29 * 86400 * 1000));
  const [views, conversations, bookings, rooms, types, nearby] = await Promise.all([
    supabase.from("dorm_view_counts").select("day, views").eq("dorm_id", dorm.id).gte("day", since30),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("dorm_id", dorm.id),
    supabase.from("bookings").select("status").eq("dorm_id", dorm.id),
    supabase.from("rooms").select("status").eq("dorm_id", dorm.id),
    supabase.from("room_types").select("monthly_price").eq("dorm_id", dorm.id).order("monthly_price").limit(1),
    supabase.rpc("nearby_price_stats", { target_dorm_id: dorm.id, radius_km: 3 }),
  ]);

  const viewsByDay = new Map((views.data ?? []).map((v) => [v.day, v.views]));
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(now.getTime() - (13 - i) * 86400 * 1000);
    const key = bangkokDay(date);
    return { key, label: dayLabel.format(date), views: viewsByDay.get(key) ?? 0 };
  });
  const views30 = [...viewsByDay.values()].reduce((a, b) => a + b, 0);
  const views7 = days.slice(-7).reduce((a, d) => a + d.views, 0);
  const peak = Math.max(1, ...days.map((d) => d.views));

  const chats = conversations.count ?? 0;
  const confirmed = (bookings.data ?? []).filter((b) => b.status === "confirmed").length;
  const requests = (bookings.data ?? []).length;
  const roomList = rooms.data ?? [];
  const taken = roomList.filter((r) => r.status === "occupied" || r.status === "held").length;
  const myPrice = types.data?.[0]?.monthly_price ?? null;
  const area = nearby.data?.[0];

  const tiles = [
    { label: "ผู้เข้าชม 30 วัน", value: views30.toLocaleString("th-TH"), note: `7 วันล่าสุด ${views7.toLocaleString("th-TH")}` },
    { label: "แชทจากผู้สนใจ", value: chats.toLocaleString("th-TH"), note: views30 ? `${percent(Math.min(chats / views30, 1))} ของผู้เข้าชม 30 วัน` : "ยังไม่มีผู้เข้าชม" },
    { label: "แชท → จองสำเร็จ", value: chats ? percent(confirmed / chats) : "–", note: `ยืนยันแล้ว ${confirmed} จากคำขอ ${requests}` },
    { label: "อัตราเข้าพัก", value: roomList.length ? percent(taken / roomList.length) : "–", note: `มีผู้เช่าหรือติดจอง ${taken} จาก ${roomList.length} ห้อง` },
  ];

  return (
    <div className="flex flex-col gap-8">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="flex flex-col gap-1 rounded-3xl border border-border-button-default bg-background-primary-default p-4 shadow-sm">
            <dt className="text-caption-1-medium text-text-secondary">{t.label}</dt>
            <dd className="text-title-1-semibold text-text-primary tabular-nums">{t.value}</dd>
            <dd className="text-caption-1-regular text-text-tertiary">{t.note}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="views-title" className="flex flex-col gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-sm">
        <h2 id="views-title" className="text-headline-semibold text-text-primary">
          ผู้เข้าชมหน้าหอ 14 วันล่าสุด
        </h2>
        <div className="flex h-40 items-end gap-0.5" aria-hidden>
          {days.map((d) => (
            <div key={d.key} className="group relative flex h-full flex-1 items-end" title={`${d.label}: ${d.views} ครั้ง`}>
              <div
                className="w-full rounded-t-[4px] bg-chart-1 transition-colors group-hover:bg-chart-1-active"
                style={{ height: `${d.views ? Math.max((d.views / peak) * 100, 3) : 0}%` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 rounded-md bg-background-primary-default px-2 py-1 text-caption-1-medium whitespace-nowrap text-text-primary shadow-md group-hover:block">
                {d.label}: {d.views}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-caption-2-regular text-text-tertiary" aria-hidden>
          <span>{days[0].label}</span>
          <span>{days[days.length - 1].label}</span>
        </div>
        <table className="sr-only">
          <caption>ผู้เข้าชมรายวัน</caption>
          <thead>
            <tr>
              <th scope="col">วัน</th>
              <th scope="col">ผู้เข้าชม</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.key}>
                <td>{d.label}</td>
                <td>{d.views}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="price-title" className="flex flex-col gap-2 rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-sm">
        <h2 id="price-title" className="text-headline-semibold text-text-primary">
          ราคาเทียบหอใกล้เคียง (รัศมี 3 กม.)
        </h2>
        {area && area.dorm_count > 0 && myPrice != null ? (
          <>
            <p className="text-body-regular text-text-primary">
              ค่าเช่าเริ่มต้นของคุณ <span className="text-body-semibold tabular-nums">{baht(myPrice)}</span> · เฉลี่ยของ {area.dorm_count} หอใกล้เคียง{" "}
              <span className="text-body-semibold tabular-nums">{baht(area.avg_min_price)}</span> (ต่ำสุด {baht(area.min_min_price)} สูงสุด{" "}
              {baht(area.max_min_price)})
            </p>
            <p className="text-body-regular text-text-secondary">
              {myPrice > area.avg_min_price * 1.1
                ? "ราคาสูงกว่าค่าเฉลี่ยในย่าน ลองเน้นจุดเด่น เช่น สิ่งอำนวยความสะดวกหรือการเดินทาง ในรายละเอียดหอ"
                : myPrice < area.avg_min_price * 0.9
                  ? "ราคาต่ำกว่าค่าเฉลี่ยในย่าน เป็นจุดขายที่ดี"
                  : "ราคาใกล้เคียงค่าเฉลี่ยในย่าน"}
            </p>
          </>
        ) : (
          <p className="text-body-regular text-text-secondary">ยังไม่มีข้อมูลหอใกล้เคียงพอ หรือหอยังไม่ได้ปักหมุดแผนที่</p>
        )}
      </section>
    </div>
  );
}
