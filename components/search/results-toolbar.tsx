"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiListUnordered, RiMap2Line } from "@remixicon/react";
import { Select, SelectItem } from "@/components/base/select/select";
import { SORTS, searchHref, type SearchFilters, type SortKey } from "@/lib/dorms/search-params";
import { cx } from "@/utils/cx";

/** Result count, sort order and list/map switch. Sorting navigates, so the order stays in the URL. */
export function ResultsToolbar({ filters, total }: { filters: SearchFilters; total: number }) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-body-medium text-text-primary" aria-live="polite">
        {total > 0 ? `พบ ${total.toLocaleString("th-TH")} หอพัก` : "ไม่พบหอพักที่ตรงกับเงื่อนไข"}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {filters.view === "list" ? (
          <Select
            aria-label="เรียงตาม"
            size="sm"
            selectedKey={filters.sort}
            onSelectionChange={(key) => router.push(searchHref({ ...filters, sort: key as SortKey, page: 1 }))}
          >
            {(Object.keys(SORTS) as SortKey[]).filter((key) => key !== "distance" || filters.to).map((key) => (
              <SelectItem key={key} id={key} textValue={SORTS[key]}>
                {SORTS[key]}
              </SelectItem>
            ))}
          </Select>
        ) : null}
        <nav aria-label="รูปแบบการแสดงผล" className="flex rounded-xl bg-background-tertiary-default p-1">
          {(
            [
              { view: "list", label: "รายการ", icon: RiListUnordered },
              { view: "map", label: "แผนที่", icon: RiMap2Line },
            ] as const
          ).map(({ view, label, icon: Icon }) => (
            <Link
              key={view}
              href={searchHref({ ...filters, view, page: 1 })}
              aria-current={filters.view === view ? "page" : undefined}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-body-regular outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring",
                filters.view === view
                  ? "bg-background-primary-default text-body-medium text-text-primary shadow-xs"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
