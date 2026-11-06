"use server";

import { revalidatePath } from "next/cache";
import { MAX_PHOTOS } from "@/lib/dorms/options";
import { getOwnedDorm } from "@/lib/dorms/owner";
import type { FormState } from "@/lib/dorms/schemas";
import { createClient } from "@/lib/supabase/server";


const BUCKET = "dorm-photos";

function revalidate(dormId: string) {
  revalidatePath(`/owner/dorms/${dormId}`, "layout");
  revalidatePath("/owner");
}

/** Keeps sort_order 0..n-1 in the given order and the dorm's cover on the first photo. */
async function writeOrder(dormId: string, orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) => supabase.from("dorm_photos").update({ sort_order: index }).eq("id", id).eq("dorm_id", dormId)),
  );
  const { data: first } = await supabase
    .from("dorm_photos")
    .select("url")
    .eq("dorm_id", dormId)
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  await supabase.from("dorms").update({ cover_url: first?.url ?? null }).eq("id", dormId);
}

/**
 * Records photos the browser has already uploaded to `<owner id>/<dorm id>/…`.
 * Paths outside that folder are rejected, so nobody can attach another owner's files.
 */
export async function addDormPhotos(dormId: string, paths: string[]): Promise<FormState> {
  const dorm = await getOwnedDorm(dormId);
  const prefix = `${dorm.owner_id}/${dorm.id}/`;
  const valid = paths.filter((p) => p.startsWith(prefix) && !p.includes("..") && /\.(webp|jpe?g|png)$/i.test(p));
  if (valid.length === 0) return { error: "ไม่พบไฟล์ที่อัปโหลด ลองใหม่อีกครั้ง" };

  const supabase = await createClient();
  const { data: existing } = await supabase.from("dorm_photos").select("id").eq("dorm_id", dorm.id).order("sort_order");
  const current = existing ?? [];
  if (current.length + valid.length > MAX_PHOTOS) {
    await supabase.storage.from(BUCKET).remove(valid);
    return { error: `เพิ่มรูปได้สูงสุด ${MAX_PHOTOS} รูปต่อหอ` };
  }

  const rows = valid.map((path, index) => ({
    dorm_id: dorm.id,
    storage_path: path,
    url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
    sort_order: current.length + index,
  }));
  const { data: inserted, error } = await supabase.from("dorm_photos").insert(rows).select("id");
  if (error || !inserted) {
    await supabase.storage.from(BUCKET).remove(valid);
    return { error: "บันทึกรูปไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }

  await writeOrder(dorm.id, [...current.map((p) => p.id), ...inserted.map((p) => p.id)]);
  revalidate(dorm.id);
  return { ok: true, message: `เพิ่ม ${inserted.length} รูปแล้ว` };
}

/** Saves a new order; the first photo becomes the cover. */
export async function reorderDormPhotos(dormId: string, orderedIds: string[]): Promise<FormState> {
  const dorm = await getOwnedDorm(dormId);
  const supabase = await createClient();
  const { data: photos } = await supabase.from("dorm_photos").select("id").eq("dorm_id", dorm.id);
  const known = new Set((photos ?? []).map((p) => p.id));
  if (orderedIds.length !== known.size || !orderedIds.every((id) => known.has(id))) {
    return { error: "ลำดับรูปไม่ตรงกับข้อมูลล่าสุด รีเฟรชหน้าแล้วลองใหม่" };
  }
  await writeOrder(dorm.id, orderedIds);
  revalidate(dorm.id);
  return { ok: true };
}

export async function deleteDormPhoto(dormId: string, photoId: string): Promise<FormState> {
  const dorm = await getOwnedDorm(dormId);
  const supabase = await createClient();
  const { data: photo } = await supabase
    .from("dorm_photos")
    .select("id, storage_path")
    .eq("id", photoId)
    .eq("dorm_id", dorm.id)
    .maybeSingle();
  if (!photo) return { error: "ไม่พบรูปนี้ อาจถูกลบไปแล้ว" };

  if (dorm.status === "published") {
    const { count } = await supabase.from("dorm_photos").select("id", { count: "exact", head: true }).eq("dorm_id", dorm.id);
    if ((count ?? 0) <= 1) return { error: "หอที่เผยแพร่อยู่ต้องมีรูปอย่างน้อย 1 รูป ปิดประกาศก่อนถ้าจะลบรูปสุดท้าย" };
  }

  const { error } = await supabase.from("dorm_photos").delete().eq("id", photo.id);
  if (error) return { error: "ลบรูปไม่สำเร็จ ลองใหม่อีกครั้ง" };
  if (photo.storage_path) await supabase.storage.from(BUCKET).remove([photo.storage_path]);

  const { data: rest } = await supabase.from("dorm_photos").select("id").eq("dorm_id", dorm.id).order("sort_order");
  await writeOrder(dorm.id, (rest ?? []).map((p) => p.id));
  revalidate(dorm.id);
  return { ok: true };
}
