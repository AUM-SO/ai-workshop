"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { requireOwner, getOwnedDorm } from "@/lib/dorms/owner";
import {
  dormDetailsSchema,
  dormGeneralSchema,
  dormLocationSchema,
  fieldErrors,
  type FormState,
} from "@/lib/dorms/schemas";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type DormUpdate = Database["public"]["Tables"]["dorms"]["Update"];

export type DormStep = "general" | "location" | "details";

const NEXT_STEP: Record<DormStep, string> = {
  general: "location",
  location: "details",
  details: "photos",
};

function readStep(step: DormStep, formData: FormData) {
  const schemas = { general: dormGeneralSchema, location: dormLocationSchema, details: dormDetailsSchema };
  const raw =
    step === "details"
      ? {
          amenities: formData.getAll("amenities").map(String),
          nearby: String(formData.get("nearby") ?? ""),
          rules: String(formData.get("rules") ?? ""),
        }
      : Object.fromEntries([...formData.entries()].filter(([key]) => !key.startsWith("$")).map(([k, v]) => [k, String(v)]));
  return (schemas[step] as z.ZodType).safeParse(raw);
}

/** Step 1 of a new dorm: creates the draft, then continues to the location step. */
export async function createDorm(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireOwner("/owner/dorms/new");
  const parsed = dormGeneralSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    gender_policy: String(formData.get("gender_policy") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dorms")
    .insert({ ...parsed.data, owner_id: profile.id })
    .select("id")
    .single();
  if (error || !data) return { error: "สร้างหอไม่สำเร็จ ลองใหม่อีกครั้ง" };

  revalidatePath("/owner");
  redirect(`/owner/dorms/${data.id}/info?step=location`);
}

/** Saves one step of the dorm info form. `continueTo` moves the wizard forward after saving. */
export async function updateDormStep(
  dormId: string,
  step: DormStep,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await getOwnedDorm(dormId);
  const parsed = readStep(step, formData);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("dorms")
    .update(parsed.data as DormUpdate)
    .eq("id", dormId);
  if (error) return { error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" };

  revalidatePath(`/owner/dorms/${dormId}`, "layout");
  revalidatePath("/owner");
  if (formData.get("intent") === "continue") {
    const next = NEXT_STEP[step];
    redirect(next === "photos" ? `/owner/dorms/${dormId}/photos` : `/owner/dorms/${dormId}/info?step=${next}`);
  }
  return { ok: true, message: "บันทึกแล้ว" };
}

const PUBLISH_ERRORS: Record<string, string> = {
  address: "กรอกที่อยู่และจังหวัดก่อนเผยแพร่",
  photos: "เพิ่มรูปหออย่างน้อย 1 รูปก่อนเผยแพร่",
  rooms: "เพิ่มห้องอย่างน้อย 1 ห้องก่อนเผยแพร่",
};

export async function setDormStatus(dormId: string, status: "published" | "draft" | "archived"): Promise<FormState> {
  await getOwnedDorm(dormId);
  const supabase = await createClient();
  const { error } = await supabase.from("dorms").update({ status }).eq("id", dormId);
  if (error) {
    // The publish guard in the database names what is missing: "dorm_not_publishable: photos".
    const reason = error.message.match(/dorm_not_publishable: (\w+)/)?.[1];
    return { error: (reason && PUBLISH_ERRORS[reason]) || "เปลี่ยนสถานะไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
  revalidatePath(`/owner/dorms/${dormId}`, "layout");
  revalidatePath("/owner");
  return { ok: true };
}

export async function deleteDorm(dormId: string): Promise<FormState> {
  const dorm = await getOwnedDorm(dormId);
  const supabase = await createClient();

  // Remove the photo files first; the rows go with the dorm (on delete cascade).
  const { data: photos } = await supabase.from("dorm_photos").select("storage_path").eq("dorm_id", dorm.id);
  const paths = (photos ?? []).map((p) => p.storage_path).filter((p): p is string => Boolean(p));
  if (paths.length) await supabase.storage.from("dorm-photos").remove(paths);

  const { error } = await supabase.from("dorms").delete().eq("id", dorm.id);
  if (error) return { error: "ลบหอไม่สำเร็จ ลองใหม่อีกครั้ง" };

  revalidatePath("/owner");
  redirect("/owner");
}
