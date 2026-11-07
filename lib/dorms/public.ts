import { cacheLife, cacheTag } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import { parseOtherFees } from "./costs";
import type { RoomStatus } from "./options";
import { isUuid } from "./owner-ids";

/** Cache tag of one dorm's public page; owner edits refresh it with updateTag. */
export const dormTag = (dormId: string) => `dorm:${dormId}`;
/** Cache tag for anything that lists published dorms (search, sitemap, landing stats). */
export const DORMS_TAG = "dorms";

export interface PublicRoom {
  id: string;
  room_no: string;
  floor: number;
  status: RoomStatus;
  room_type_id: string;
}

/**
 * Everything the public dorm page shows, read as an anonymous visitor, so only a
 * published dorm comes back. Room statuses here may be a little behind; the page
 * keeps them live over Supabase Realtime.
 */
export async function getPublicDorm(dormId: string) {
  "use cache";
  cacheTag(dormTag(dormId));
  cacheLife("hours");

  if (!isUuid(dormId)) return null;
  const supabase = createAnonClient();
  const { data: dorm } = await supabase.from("dorms").select("*").eq("id", dormId).eq("status", "published").maybeSingle();
  if (!dorm) return null;

  const [photos, types, rooms, owner, reviewRows] = await Promise.all([
    supabase.from("dorm_photos").select("id, url").eq("dorm_id", dorm.id).order("sort_order"),
    supabase.from("room_types").select("*").eq("dorm_id", dorm.id).order("monthly_price"),
    supabase.from("rooms").select("id, room_no, floor, status, room_type_id").eq("dorm_id", dorm.id),
    supabase.from("profiles").select("display_name, verified_at, created_at").eq("id", dorm.owner_id).maybeSingle(),
    supabase.from("reviews").select("id, rating, body, created_at, tenant_id").eq("dorm_id", dorm.id).order("created_at", { ascending: false }),
  ]);

  const reviewList = reviewRows.data ?? [];
  const reviewerIds = [...new Set(reviewList.map((r) => r.tenant_id))];
  const { data: reviewers } = reviewerIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", reviewerIds)
    : { data: [] };
  const reviewerName = new Map((reviewers ?? []).map((p) => [p.id, p.display_name]));
  const reviews = reviewList.map((r) => ({ ...r, tenantName: reviewerName.get(r.tenant_id) ?? "ผู้เช่า" }));
  const rating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  const roomList = (rooms.data ?? []) as PublicRoom[];
  const roomTypes = (types.data ?? []).map((type) => ({
    ...type,
    size_sqm: type.size_sqm == null ? null : Number(type.size_sqm),
    water_rate: type.water_rate == null ? null : Number(type.water_rate),
    electric_rate: type.electric_rate == null ? null : Number(type.electric_rate),
    other_fees: parseOtherFees(type.other_fees),
    totalRooms: roomList.filter((r) => r.room_type_id === type.id).length,
  }));

  return {
    dorm,
    photos: photos.data ?? [],
    roomTypes,
    rooms: roomList,
    owner: owner.data,
    reviews,
    rating,
  };
}

export type PublicDorm = NonNullable<Awaited<ReturnType<typeof getPublicDorm>>>;
