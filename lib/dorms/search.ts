import { cacheLife, cacheTag } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import { DORMS_TAG } from "./public";
import { MAP_PAGE_SIZE, PAGE_SIZE, type SearchFilters } from "./search-params";

/** Runs search_dorms as an anonymous visitor. Cached briefly; owner edits expire it through DORMS_TAG. */
export async function searchDorms(filters: SearchFilters) {
  "use cache";
  cacheTag(DORMS_TAG);
  cacheLife("minutes");

  const pageSize = filters.view === "map" ? MAP_PAGE_SIZE : PAGE_SIZE;
  const { data, error } = await createAnonClient().rpc("search_dorms", {
    q: filters.q || undefined,
    province_filter: filters.province ?? undefined,
    gender_filter: filters.gender ?? undefined,
    price_min: filters.min ?? undefined,
    price_max: filters.max ?? undefined,
    amenity_filter: filters.amenities.length ? filters.amenities : undefined,
    vacant_only: filters.vacant,
    sort: filters.sort,
    page_size: pageSize,
    page_offset: (filters.page - 1) * pageSize,
  });
  if (error) return { results: [], total: 0, pageSize, failed: true };
  return { results: data ?? [], total: Number(data?.[0]?.total_count ?? 0), pageSize, failed: false };
}

export type SearchResult = Awaited<ReturnType<typeof searchDorms>>["results"][number];
