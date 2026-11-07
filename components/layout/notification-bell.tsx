"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { RiNotification3Line } from "@remixicon/react";
import { Dropdown, DropdownDivider, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { MENU_ITEM_INTERACTIVE } from "@/components/base/dropdown/menu-styles";
import { markAllNotificationsRead } from "@/app/chat/actions";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { cx } from "@/utils/cx";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

const when = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function NotificationBell({ userId, initial }: { userId: string; initial: NotificationRow[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const unread = items.filter((n) => !n.read_at).length;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotificationRow;
          setItems((list) => (list.some((n) => n.id === row.id) ? list : [row, ...list].slice(0, 20)));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    // Opening the panel counts as seeing everything in it.
    if (next && unread > 0) {
      const now = new Date().toISOString();
      setItems((list) => list.map((n) => (n.read_at ? n : { ...n, read_at: now })));
      startTransition(() => markAllNotificationsRead());
    }
  };

  return (
    <Dropdown isOpen={open} onOpenChange={onOpenChange}>
      <DropdownTrigger
        aria-label={unread ? `การแจ้งเตือน ยังไม่ได้อ่าน ${unread} รายการ` : "การแจ้งเตือน"}
        className="relative flex size-9 items-center justify-center rounded-full text-foreground-icon-secondary transition-colors hover:bg-background-secondary-hover"
      >
        <RiNotification3Line className="size-5" aria-hidden />
        {unread ? (
          <span className="absolute -end-0.5 -top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-accent-600 px-1 text-caption-2-semibold text-text-white tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </DropdownTrigger>
      <DropdownPopover aria-label="การแจ้งเตือน" placement="bottom end" className="w-80 max-h-[70vh]">
        <p className="px-2 py-1.5 text-body-semibold text-text-primary">การแจ้งเตือน</p>
        <DropdownDivider />
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-body-regular text-text-secondary">ยังไม่มีการแจ้งเตือน</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link ?? "/chat"}
                  onClick={() => setOpen(false)}
                  className={cx("flex flex-col gap-0.5 rounded-xl px-2 py-2 outline-none", MENU_ITEM_INTERACTIVE)}
                >
                  <span className="text-body-medium text-text-primary">{n.title}</span>
                  {n.body ? <span className="line-clamp-2 text-caption-1-regular text-text-secondary">{n.body}</span> : null}
                  <span className="text-caption-2-regular text-text-tertiary">{when.format(new Date(n.created_at))}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DropdownPopover>
    </Dropdown>
  );
}
