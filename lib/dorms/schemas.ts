import { z } from "zod";
import { AMENITY_KEYS, FURNITURE_KEYS, PROVINCES } from "./options";

// Form values arrive as strings; these schemas trim, coerce and give Thai messages.

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === "" ? null : value));

const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((value) => (value === "" || value == null ? null : Number(value)), schema.nullable());

export const dormGeneralSchema = z.object({
  name: z.string().trim().min(1, "กรอกชื่อหอพัก").max(120, "ชื่อหอยาวได้ไม่เกิน 120 ตัวอักษร"),
  gender_policy: z.enum(["mixed", "female", "male"], { message: "เลือกประเภทหอ" }),
  description: optionalText(2000, "รายละเอียดยาวได้ไม่เกิน 2,000 ตัวอักษร"),
});

export const dormLocationSchema = z
  .object({
    address: z.string().trim().min(1, "กรอกที่อยู่").max(300, "ที่อยู่ยาวได้ไม่เกิน 300 ตัวอักษร"),
    district: optionalText(100, "เขต/อำเภอยาวได้ไม่เกิน 100 ตัวอักษร"),
    province: z.enum(PROVINCES, { message: "เลือกจังหวัด" }),
    lat: optionalNumber(z.number().min(-90).max(90)),
    lng: optionalNumber(z.number().min(-180).max(180)),
  })
  .refine((v) => (v.lat == null) === (v.lng == null), { message: "ปักหมุดใหม่อีกครั้ง", path: ["lat"] });

export const dormDetailsSchema = z.object({
  amenities: z.array(z.enum(AMENITY_KEYS)).default([]),
  rules: optionalText(2000, "กฎหอยาวได้ไม่เกิน 2,000 ตัวอักษร"),
});

const baht = (label: string) =>
  z.coerce
    .number({ message: `กรอก${label}เป็นตัวเลข` })
    .int(`${label}ต้องเป็นจำนวนเต็ม`)
    .min(0, `${label}ต้องไม่ติดลบ`)
    .max(1_000_000, `${label}สูงเกินไป`);

export const otherFeeSchema = z.object({
  label: z.string().trim().min(1, "กรอกชื่อค่าใช้จ่าย").max(60),
  amount: baht("จำนวนเงิน"),
  monthly: z.boolean(),
});

export const roomTypeSchema = z
  .object({
    name: z.string().trim().min(1, "กรอกชื่อประเภทห้อง").max(80, "ชื่อยาวได้ไม่เกิน 80 ตัวอักษร"),
    size_sqm: optionalNumber(z.number({ message: "กรอกขนาดเป็นตัวเลข" }).positive("ขนาดต้องมากกว่า 0").max(1000)),
    monthly_price: baht("ค่าเช่า").refine((v) => v > 0, "กรอกค่าเช่าต่อเดือน"),
    deposit: baht("เงินมัดจำ"),
    advance_months: z.coerce.number().int().min(0).max(12, "ล่วงหน้าได้ไม่เกิน 12 เดือน"),
    water_mode: z.enum(["metered", "flat"]),
    water_rate: optionalNumber(z.number().min(0).max(1000)),
    water_flat: optionalNumber(z.number().int().min(0).max(100_000)),
    electric_rate: optionalNumber(z.number().min(0).max(1000)),
    furniture: z.array(z.enum(FURNITURE_KEYS)).default([]),
    other_fees: z.array(otherFeeSchema).max(10, "เพิ่มได้ไม่เกิน 10 รายการ").default([]),
  })
  .superRefine((v, ctx) => {
    if (v.water_mode === "metered" && v.water_rate == null) {
      ctx.addIssue({ code: "custom", path: ["water_rate"], message: "กรอกค่าน้ำต่อหน่วย" });
    }
    if (v.water_mode === "flat" && v.water_flat == null) {
      ctx.addIssue({ code: "custom", path: ["water_flat"], message: "กรอกค่าน้ำเหมาจ่ายต่อเดือน" });
    }
  });

export const bulkRoomsSchema = z
  .object({
    room_type_id: z.uuid({ message: "เลือกประเภทห้อง" }),
    floor: z.coerce.number().int().min(-5, "ชั้นไม่ถูกต้อง").max(200, "ชั้นไม่ถูกต้อง"),
    prefix: z.string().trim().max(5, "คำนำหน้ายาวได้ไม่เกิน 5 ตัวอักษร").default(""),
    from: z.coerce.number({ message: "กรอกเลขห้องเริ่มต้น" }).int().min(0).max(99_999),
    to: z.coerce.number({ message: "กรอกเลขห้องสุดท้าย" }).int().min(0).max(99_999),
  })
  .refine((v) => v.to >= v.from, { message: "เลขห้องสุดท้ายต้องไม่น้อยกว่าเลขเริ่มต้น", path: ["to"] })
  .refine((v) => v.to - v.from < 100, { message: "เพิ่มได้ครั้งละไม่เกิน 100 ห้อง", path: ["to"] });

/** Field errors keyed by input name, in the shape React Aria's Form `validationErrors` expects. */
export type FieldErrors = Record<string, string>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}

/** Result of a form action: a form-level message, per-field errors, or success. */
export type FormState = { ok?: boolean; error?: string; fieldErrors?: FieldErrors; message?: string };
