import { Suspense } from "react";
import type { Metadata } from "next";
import { RiArrowLeftSLine, RiArrowRightSLine, RiSearchEyeLine } from "@remixicon/react";
import { ButtonLink } from "@/components/base/buttons/button";
import { DormResultCard } from "@/components/search/dorm-result-card";
import { ResultsToolbar } from "@/components/search/results-toolbar";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchMap } from "@/components/search/search-map";
import { searchDorms } from "@/lib/dorms/search";
import { parseFilters, searchHref, type SearchFilters as Filters } from "@/lib/dorms/search-params";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  const where = filters.q || filters.province;
  return {
    title: where ? `หอพักใกล้${where}` : "ค้นหาหอพัก",
    description: where
      ? `หอพักและอพาร์ตเมนต์ใกล้${where} ดูห้องว่างจริง ค่าเช่า และค่าใช้จ่ายทั้งหมดก่อนจอง`
      : "ค้นหาหอพักตามทำเล มหาวิทยาลัย หรือสถานีรถไฟฟ้า กรองราคา ประเภทหอ และสิ่งอำนวยความสะดวก",
  };
}

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:py-10">
      <h1 className="text-title-1-semibold text-text-primary">ค้นหาหอพัก</h1>
      <Suspense fallback={<div className="h-64" aria-hidden />}>
        <SearchContent {...props} />
      </Suspense>
    </div>
  );
}

async function SearchContent({ searchParams }: PageProps<"/search">) {
  const filters = parseFilters(await searchParams);
  const { results, total, pageSize, failed } = await searchDorms(filters);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      {/* Keyed so the form's defaults follow the URL after navigating. */}
      <SearchFilters key={searchHref(filters)} filters={filters} />
      <ResultsToolbar filters={filters} total={total} />

      {failed ? (
        <p className="text-body-regular text-text-error-primary">ค้นหาไม่สำเร็จ ลองใหม่อีกครั้ง</p>
      ) : results.length === 0 ? (
        <EmptyState filters={filters} />
      ) : filters.view === "map" ? (
        <MapView results={results} />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((dorm, index) => (
              <li key={dorm.id}>
                <DormResultCard dorm={dorm} priority={index < 3} />
              </li>
            ))}
          </ul>
          {pages > 1 ? <Pagination filters={filters} pages={pages} /> : null}
        </>
      )}
    </>
  );
}

function MapView({ results }: { results: Awaited<ReturnType<typeof searchDorms>>["results"] }) {
  const pinned = results.filter((d) => d.lat != null && d.lng != null);
  const unpinned = results.length - pinned.length;
  return (
    <div className="flex flex-col gap-3">
      <SearchMap
        dorms={pinned.map((d) => ({
          id: d.id,
          name: d.name,
          lat: d.lat,
          lng: d.lng,
          min_price: d.min_price,
          vacant_rooms: d.vacant_rooms,
        }))}
      />
      {/* The map is mouse/touch only; the same results as links for everyone else. */}
      <details className="rounded-2xl border border-border-button-default bg-background-primary-default p-4">
        <summary className="cursor-pointer text-body-medium text-text-primary">
          รายชื่อหอบนแผนที่ ({pinned.length})
          {unpinned ? <span className="text-text-tertiary"> · ไม่มีหมุดอีก {unpinned} หอ</span> : null}
        </summary>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((dorm) => (
            <li key={dorm.id}>
              <DormResultCard dorm={dorm} />
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Pagination({ filters, pages }: { filters: Filters; pages: number }) {
  const { page } = filters;
  return (
    <nav aria-label="หน้าผลการค้นหา" className="flex items-center justify-center gap-3">
      {page > 1 ? (
        <ButtonLink href={searchHref({ ...filters, page: page - 1 })} variant="secondary" leadingIcon={RiArrowLeftSLine}>
          ก่อนหน้า
        </ButtonLink>
      ) : null}
      <span className="text-body-regular text-text-secondary">
        หน้า {page} จาก {pages}
      </span>
      {page < pages ? (
        <ButtonLink href={searchHref({ ...filters, page: page + 1 })} variant="secondary" trailingIcon={RiArrowRightSLine}>
          ถัดไป
        </ButtonLink>
      ) : null}
    </nav>
  );
}

function EmptyState({ filters }: { filters: Filters }) {
  const hasFilters = filters.province || filters.gender || filters.min || filters.max || filters.amenities.length || filters.vacant;
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border-button-default px-6 py-12 text-center">
      <RiSearchEyeLine className="size-10 text-foreground-icon-tertiary" aria-hidden />
      <p className="text-headline-semibold text-text-primary">ยังไม่พบหอพักที่ตรงกับการค้นหา</p>
      <p className="max-w-md text-body-regular text-text-secondary">
        ลองใช้คำค้นที่สั้นลง เช่น ชื่อย่านหรือชื่อสถานี{hasFilters ? " หรือเอาตัวกรองบางอย่างออก" : ""}
      </p>
      {hasFilters ? (
        <ButtonLink href={searchHref({ q: filters.q, view: filters.view })} variant="secondary">
          ค้นหาโดยไม่ใช้ตัวกรอง
        </ButtonLink>
      ) : null}
    </div>
  );
}
