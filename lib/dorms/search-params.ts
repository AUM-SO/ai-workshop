// Search URL parameters: parsing, defaults and links. Safe to import in client components.

import { MINUTES, MODES, placeByKey, type CommuteMode, type PlaceKey } from "./commute";
import { AMENITY_KEYS, PROVINCES, type AmenityKey, type GenderPolicy } from "./options";

export const SORTS = {
  relevance: "เกี่ยวข้องที่สุด",
  price_asc: "ราคาต่ำไปสูง",
  price_desc: "ราคาสูงไปต่ำ",
  vacant: "ห้องว่างมากที่สุด",
  distance: "ใกล้จุดหมายที่สุด",
} as const;
export type SortKey = keyof typeof SORTS;

export const PAGE_SIZE = 12;
export const MAP_PAGE_SIZE = 50;

export interface SearchFilters {
  q: string;
  province: string | null;
  gender: GenderPolicy | null;
  min: number | null;
  max: number | null;
  amenities: AmenityKey[];
  vacant: boolean;
  sort: SortKey;
  page: number;
  view: "list" | "map";
  /** Commute search destination, travel mode and time budget. */
  to: PlaceKey | null;
  mode: CommuteMode;
  mins: number;
}

type Raw = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
const money = (value: string) => {
  const n = Number(value.replace(/[^\d]/g, ""));
  return value.trim() !== "" && Number.isFinite(n) && n > 0 ? Math.min(n, 1_000_000) : null;
};

/** Reads /search query parameters, dropping anything unknown or malformed. */
export function parseFilters(raw: Raw): SearchFilters {
  const province = one(raw.province);
  const gender = one(raw.gender);
  const amenityValues = (Array.isArray(raw.amenities) ? raw.amenities : one(raw.amenities).split(","))
    .map((a) => a.trim())
    .filter((a): a is AmenityKey => (AMENITY_KEYS as string[]).includes(a));
  const to = placeByKey(one(raw.to))?.key ?? null;
  const mode = one(raw.mode);
  const mins = Number(one(raw.mins));
  const sortRaw = one(raw.sort);
  // Distance only makes sense with a destination; a destination defaults to nearest first.
  const sort = sortRaw === "distance" && !to ? "relevance" : sortRaw || (to ? "distance" : "relevance");
  return {
    q: one(raw.q).trim().slice(0, 100),
    province: (PROVINCES as readonly string[]).includes(province) ? province : null,
    gender: gender === "male" || gender === "female" || gender === "mixed" ? gender : null,
    min: money(one(raw.min)),
    max: money(one(raw.max)),
    amenities: [...new Set(amenityValues)],
    vacant: one(raw.vacant) === "1",
    sort: sort in SORTS ? (sort as SortKey) : "relevance",
    page: Math.max(1, Math.min(500, Number.parseInt(one(raw.page), 10) || 1)),
    view: one(raw.view) === "map" ? "map" : "list",
    to,
    mode: mode in MODES ? (mode as CommuteMode) : "transit",
    mins: (MINUTES as readonly number[]).includes(mins) ? mins : 30,
  };
}

/** Builds a /search URL from filters, leaving out defaults so links stay short. */
export function searchHref(filters: Partial<SearchFilters>) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.province) params.set("province", filters.province);
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.min) params.set("min", String(filters.min));
  if (filters.max) params.set("max", String(filters.max));
  if (filters.amenities?.length) params.set("amenities", filters.amenities.join(","));
  if (filters.vacant) params.set("vacant", "1");
  if (filters.to) {
    params.set("to", filters.to);
    if (filters.mode && filters.mode !== "transit") params.set("mode", filters.mode);
    if (filters.mins && filters.mins !== 30) params.set("mins", String(filters.mins));
  }
  if (filters.sort && filters.sort !== (filters.to ? "distance" : "relevance")) params.set("sort", filters.sort);
  if (filters.view === "map") params.set("view", "map");
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}
