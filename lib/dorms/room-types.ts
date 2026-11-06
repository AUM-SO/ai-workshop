import { createClient } from "@/lib/supabase/server";
import { parseOtherFees } from "./costs";
import { isUuid } from "./owner";

/** Room types of a dorm the caller owns (call getOwnedDorm first), with their room counts. */
export async function listRoomTypes(dormId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("room_types")
    .select("*, rooms(status)")
    .eq("dorm_id", dormId)
    .order("monthly_price");

  return (data ?? []).map(({ rooms, other_fees, ...type }) => ({
    ...type,
    other_fees: parseOtherFees(other_fees),
    roomCount: rooms.length,
    vacantCount: rooms.filter((r) => r.status === "vacant").length,
  }));
}

export async function getRoomType(dormId: string, roomTypeId: string) {
  if (!isUuid(roomTypeId)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("room_types")
    .select("*")
    .eq("id", roomTypeId)
    .eq("dorm_id", dormId)
    .maybeSingle();
  return data ? { ...data, other_fees: parseOtherFees(data.other_fees), size_sqm: data.size_sqm == null ? null : Number(data.size_sqm) } : null;
}
