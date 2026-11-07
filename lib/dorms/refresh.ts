import { revalidatePath, updateTag } from "next/cache";
import { DORMS_TAG, dormTag } from "./public";

/**
 * Call from owner Server Actions after any change to a dorm, its photos, room types or rooms.
 * Refreshes the owner's pages and expires the cached public page and listings at once,
 * so the owner sees their change on the public page right away.
 */
export function refreshDorm(dormId: string) {
  revalidatePath(`/owner/dorms/${dormId}`, "layout");
  revalidatePath("/owner");
  updateTag(dormTag(dormId));
  updateTag(DORMS_TAG);
}
