import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip } from "@/components/base/badges/chip";
import { Accordion, AccordionItem } from "@/components/base/accordion/accordion";
import { RoommateForm } from "@/components/roommates/roommate-form";
import { requireProfile } from "@/lib/auth";
import { baht } from "@/lib/dorms/costs";
import { CLEANLINESS, GUESTS, matchScore, SLEEP } from "@/lib/roommates";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "หาเพื่อนร่วมห้อง",
  description: "จับคู่รูมเมทจากจังหวัด งบ เวลานอน ความเรียบร้อย และนิสัยการใช้ห้อง",
};

export default function RoommatesPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-title-1-semibold text-text-primary">หาเพื่อนร่วมห้อง</h1>
        <p className="text-body-regular text-text-secondary">
          บอกไลฟ์สไตล์ของคุณ แล้วดูคนที่หาหอในจังหวัดเดียวกันและเข้ากันได้มากที่สุด หารค่าห้องกันได้ถูกลง ติดต่อกันเองผ่านช่องทางที่แต่ละคนเลือกแสดง
        </p>
      </div>
      <Suspense fallback={<p className="text-body-regular text-text-secondary">กำลังโหลด…</p>}>
        <Roommates />
      </Suspense>
    </div>
  );
}

async function Roommates() {
  const profile = await requireProfile("/roommates");
  const supabase = await createClient();
  const { data: mine } = await supabase.from("roommate_profiles").select("*").eq("user_id", profile.id).maybeSingle();

  const form = (
    <div className="rounded-3xl border border-border-button-default bg-background-primary-default p-6 shadow-sm">
      <RoommateForm profile={mine} />
    </div>
  );
  if (!mine) return form;

  const { data: others } = await supabase
    .from("roommate_profiles")
    .select("*")
    .eq("province", mine.province)
    .eq("active", true)
    .neq("user_id", profile.id)
    .limit(200);
  const ranked = (others ?? [])
    .map((o) => ({ ...o, score: matchScore(mine, o) }))
    .filter((o) => o.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
  const { data: names } = ranked.length
    ? await supabase.from("profiles").select("id, display_name").in("id", ranked.map((r) => r.user_id))
    : { data: [] };
  const nameOf = new Map((names ?? []).map((n) => [n.id, n.display_name ?? "ผู้ใช้"]));

  return (
    <>
      <Accordion variant="separated">
        <AccordionItem id="profile" title="โปรไฟล์รูมเมทของฉัน" headingLevel={2}>
          <RoommateForm profile={mine} />
        </AccordionItem>
      </Accordion>

      <section aria-labelledby="matches" className="flex flex-col gap-4">
        <h2 id="matches" className="text-title-3-semibold text-text-primary">
          คนที่เข้ากันได้ใน{mine.province} ({ranked.length})
        </h2>
        {!mine.active ? <p className="text-body-regular text-text-secondary">โปรไฟล์ของคุณซ่อนอยู่ คนอื่นจะไม่เห็นคุณจนกว่าจะเปิดแสดง</p> : null}
        {ranked.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {ranked.map((r) => (
              <li key={r.user_id} className="flex flex-col gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-headline-semibold text-text-primary">{nameOf.get(r.user_id)}</span>
                  <Chip color={r.score >= 80 ? "lime" : r.score >= 60 ? "blue" : "neutral"} variant="caption">
                    เข้ากัน {r.score}%
                  </Chip>
                </div>
                <ul className="flex flex-wrap gap-1.5 text-caption-1-medium text-text-secondary">
                  <li className="rounded-full bg-background-tertiary-default px-2.5 py-1">งบ ≤ {baht(r.budget_max)}</li>
                  <li className="rounded-full bg-background-tertiary-default px-2.5 py-1">{SLEEP[r.sleep as keyof typeof SLEEP]}</li>
                  <li className="rounded-full bg-background-tertiary-default px-2.5 py-1">{CLEANLINESS[r.cleanliness as keyof typeof CLEANLINESS]}</li>
                  <li className="rounded-full bg-background-tertiary-default px-2.5 py-1">{GUESTS[r.guests as keyof typeof GUESTS]}</li>
                  {r.smoking ? <li className="rounded-full bg-background-tertiary-default px-2.5 py-1">สูบบุหรี่</li> : null}
                  {r.pets ? <li className="rounded-full bg-background-tertiary-default px-2.5 py-1">มีสัตว์เลี้ยง</li> : null}
                </ul>
                {r.bio ? <p className="text-body-regular whitespace-pre-line text-text-primary">{r.bio}</p> : null}
                {r.contact ? (
                  <p className="text-body-regular text-text-secondary">
                    ติดต่อ: <bdi className="text-body-medium text-text-primary">{r.contact}</bdi>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-regular text-text-secondary">ยังไม่มีคนที่เข้ากันได้ในจังหวัดนี้ ลองกลับมาดูใหม่ หรือปรับเงื่อนไขในโปรไฟล์</p>
        )}
      </section>
    </>
  );
}
