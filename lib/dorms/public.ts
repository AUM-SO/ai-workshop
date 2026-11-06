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

  const [photos, types, rooms, owner] = await Promise.all([
    supabase.from("dorm_photos").select("id, url").eq("dorm_id", dorm.id).order("sort_order"),
    supabase.from("room_types").select("*").eq("dorm_id", dorm.id).order("monthly_price"),
    supabase.from("rooms").select("id, room_no, floor, status, room_type_id").eq("dorm_id", dorm.id),
    supabase.from("profiles").select("display_name, verified_at, created_at").eq("id", dorm.owner_id).maybeSingle(),
  ]);

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
  };
}

export type PublicDorm = NonNullable<Awaited<ReturnType<typeof getPublicDorm>>>;
