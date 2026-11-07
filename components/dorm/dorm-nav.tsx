"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/utils/cx";

/** Section links for one dorm's management area, styled as underline tabs. */
export function DormNav({ dormId }: { dormId: string }) {
  const pathname = usePathname();
  const base = `/owner/dorms/${dormId}`;
  const items = [
    { href: base, label: "ภาพรวม" },
    { href: `${base}/info`, label: "ข้อมูลหอ" },
    { href: `${base}/photos`, label: "รูปภาพ" },
    { href: `${base}/room-types`, label: "ประเภทห้อง" },
    { href: `${base}/rooms`, label: "ผังห้อง" },
    { href: `${base}/settings`, label: "การรับจอง" },
    { href: `${base}/insights`, label: "สถิติ" },
  ];

  return (
    <nav aria-label="จัดการหอ" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex min-w-max gap-1 border-b border-separator-border">
        {items.map((item) => {
          const active = item.href === base ? pathname === base : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "-mb-px inline-flex border-b-2 px-3 py-2.5 text-body-regular whitespace-nowrap outline-none transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-border-focus-ring",
                  active
                    ? "border-accent-600 text-body-medium text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
