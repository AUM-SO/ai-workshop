import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RiExternalLinkLine } from "@remixicon/react";
import { Chip } from "@/components/base/badges/chip";
import { ReportActions, VerificationActions } from "@/components/admin/admin-actions";
import { requireProfile } from "@/lib/auth";
import { REPORT_REASON_LABEL, type ReportReason } from "@/lib/dorms/trust";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "ผู้ดูแลระบบ", robots: { index: false } };

const when = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function AdminPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <h1 className="text-title-1-semibold text-text-primary">ผู้ดูแลระบบ</h1>
      <Suspense fallback={<p className="text-body-regular text-text-secondary">กำลังโหลด…</p>}>
        <AdminContent />
      </Suspense>
    </div>
  );
}

async function AdminContent() {
  const profile = await requireProfile("/admin");
  if (profile.role !== "admin") notFound();
  const supabase = await createClient();

  const [{ data: verifications }, { data: reports }] = await Promise.all([
    supabase.from("owner_verifications").select("*").eq("status", "pending").order("created_at"),
    supabase.from("reports").select("*").eq("status", "open").order("created_at"),
  ]);

  const profileIds = [...new Set([...(verifications ?? []).map((v) => v.owner_id), ...(reports ?? []).map((r) => r.reporter_id)])];
  const dormIds = [...new Set((reports ?? []).map((r) => r.dorm_id))];
  const [{ data: people }, { data: dorms }, signed] = await Promise.all([
    profileIds.length ? supabase.from("profiles").select("id, display_name").in("id", profileIds) : Promise.resolve({ data: [] }),
    dormIds.length ? supabase.from("dorms").select("id, name, status").in("id", dormIds) : Promise.resolve({ data: [] }),
    (verifications ?? []).length
      ? supabase.storage.from("verification-docs").createSignedUrls((verifications ?? []).map((v) => v.document_path), 60 * 30)
      : Promise.resolve({ data: [] }),
  ]);
  const nameOf = new Map((people ?? []).map((p) => [p.id, p.display_name ?? "ผู้ใช้"]));
  const dormOf = new Map((dorms ?? []).map((d) => [d.id, d]));
  const docUrl = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));

  return (
    <>
      <section aria-labelledby="verifications" className="flex flex-col gap-4">
        <h2 id="verifications" className="text-title-3-semibold text-text-primary">
          คำขอยืนยันตัวตน ({verifications?.length ?? 0})
        </h2>
        {verifications?.length ? (
          <ul className="flex flex-col gap-3">
            {verifications.map((v) => (
              <li key={v.id} className="flex flex-col gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-headline-semibold text-text-primary">{nameOf.get(v.owner_id)}</span>
                  <span className="text-caption-1-regular text-text-tertiary">ส่งเมื่อ {when.format(new Date(v.created_at))}</span>
                  {v.note ? <p className="text-body-regular text-text-secondary">{v.note}</p> : null}
                  {docUrl.get(v.document_path) ? (
                    <a
                      href={docUrl.get(v.document_path) ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 self-start rounded-md text-body-medium text-text-primary underline outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
                    >
                      เปิดเอกสาร
                      <RiExternalLinkLine className="size-4" aria-hidden />
                    </a>
                  ) : (
                    <span className="text-caption-1-regular text-text-error-primary">ไม่พบไฟล์เอกสาร</span>
                  )}
                </div>
                <VerificationActions id={v.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-regular text-text-secondary">ไม่มีคำขอที่รอตรวจ</p>
        )}
      </section>

      <section aria-labelledby="reports" className="flex flex-col gap-4">
        <h2 id="reports" className="text-title-3-semibold text-text-primary">
          รายงานประกาศ ({reports?.length ?? 0})
        </h2>
        {reports?.length ? (
          <ul className="flex flex-col gap-3">
            {reports.map((r) => {
              const dorm = dormOf.get(r.dorm_id);
              return (
                <li key={r.id} className="flex flex-col gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dorms/${r.dorm_id}`}
                      className="rounded-md text-headline-semibold text-text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-border-focus-ring"
                    >
                      {dorm?.name ?? "หอที่ถูกลบ"}
                    </Link>
                    <Chip color={r.reason === "scam" ? "rose" : "yellow"} variant="caption">
                      {REPORT_REASON_LABEL[r.reason as ReportReason] ?? r.reason}
                    </Chip>
                    {dorm && dorm.status !== "published" ? (
                      <Chip color="neutral" variant="caption">
                        ปิดประกาศแล้ว
                      </Chip>
                    ) : null}
                  </div>
                  {r.details ? <p className="text-body-regular text-text-primary">{r.details}</p> : null}
                  <span className="text-caption-1-regular text-text-tertiary">
                    แจ้งโดย {nameOf.get(r.reporter_id)} · {when.format(new Date(r.created_at))}
                  </span>
                  <ReportActions id={r.id} dormId={r.dorm_id} dormPublished={dorm?.status === "published"} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-body-regular text-text-secondary">ไม่มีรายงานที่ค้างอยู่</p>
        )}
      </section>
    </>
  );
}
