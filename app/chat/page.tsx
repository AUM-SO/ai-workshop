import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RiChat3Line, RiImageLine } from "@remixicon/react";
import { ButtonLink } from "@/components/base/buttons/button";
import { Chip } from "@/components/base/badges/chip";
import { requireProfile } from "@/lib/auth";
import { listConversations } from "@/lib/chat/queries";
import { cx } from "@/utils/cx";

export const metadata: Metadata = { title: "แชท" };

const when = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default function ChatInboxPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-title-1-semibold text-text-primary">แชท</h1>
      <Suspense fallback={<p className="text-body-regular text-text-secondary">กำลังโหลด…</p>}>
        <Inbox />
      </Suspense>
    </div>
  );
}

async function Inbox() {
  const profile = await requireProfile("/chat");
  const conversations = await listConversations(profile.id);

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border-button-default px-6 py-12 text-center">
        <RiChat3Line className="size-10 text-foreground-icon-tertiary" aria-hidden />
        <p className="text-headline-semibold text-text-primary">ยังไม่มีแชท</p>
        <p className="max-w-sm text-body-regular text-text-secondary">
          {profile.role === "tenant"
            ? "เปิดหน้าหอที่สนใจ แล้วกด “แชทกับเจ้าของหอ” เพื่อถามหรือขอจองห้อง"
            : "เมื่อผู้เช่าทักหรือขอจองห้อง ข้อความจะมาอยู่ที่นี่"}
        </p>
        {profile.role === "tenant" ? <ButtonLink href="/search">ค้นหาหอพัก</ButtonLink> : null}
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-separator-border overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default shadow-sm">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            href={`/chat/${c.id}`}
            className="flex items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-background-secondary-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus-ring"
          >
            <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-background-tertiary-default">
              {c.cover ? (
                <Image src={c.cover} alt="" fill sizes="48px" className="object-cover" />
              ) : (
                <RiImageLine className="m-3 size-6 text-foreground-icon-quaternary" aria-hidden />
              )}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-2">
                <span className={cx("truncate text-body-medium text-text-primary", c.unread && "text-body-semibold")}>{c.otherName}</span>
                <Chip color="soft" variant="caption">
                  {c.role === "owner" ? "ผู้เช่า" : "เจ้าของหอ"}
                </Chip>
              </span>
              <span className="truncate text-caption-1-regular text-text-tertiary">{c.dormName}</span>
              <span className={cx("truncate text-body-regular", c.unread ? "text-text-primary" : "text-text-secondary")}>{c.preview}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-caption-1-regular text-text-tertiary">{when.format(new Date(c.lastMessageAt))}</span>
              {c.unread ? <span className="size-2.5 rounded-full bg-accent-600" aria-label="ยังไม่ได้อ่าน" /> : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
