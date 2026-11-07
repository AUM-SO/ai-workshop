import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "./owner-ids";

export { isUuid };

/** Signed-in owner (or admin). Tenants are sent to /owner, which explains how to switch. */
export async function requireOwner(next: string) {
  const profile = await requireProfile(next);
  if (profile.role !== "owner" && profile.role !== "admin") redirect("/owner");
  return profile;
}

/**
 * A dorm the signed-in owner manages, or a 404. RLS already hides other owners'
 * drafts; the explicit owner check also hides their published dorms from this area.
 */
export const getOwnedDorm = cache(async (dormId: string) => {
  const profile = await requireOwner(`/owner/dorms/${dormId}`);
  if (!isUuid(dormId)) notFound();

  const supabase = await createClient();
  const { data: dorm } = await supabase
    .from("dorms")
    .select("*")
    .eq("id", dormId)
    .eq("owner_id", profile.id)
    .maybeSingle();
  if (!dorm) notFound();
  return dorm;
});

