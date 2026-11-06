// Fixed choices for dorm and room data. Keys are stored in the database; labels are shown.

import type { Database } from "@/lib/supabase/database.types";

export type GenderPolicy = Database["public"]["Enums"]["gender_policy"];
export type DormStatus = Database["public"]["Enums"]["dorm_status"];
export type RoomStatus = Database["public"]["Enums"]["room_status"];

export const GENDER_POLICY_LABEL: Record<GenderPolicy, string> = {
  mixed: "หอรวม",
  female: "หอหญิง",
  male: "หอชาย",
};

export const DORM_STATUS_LABEL: Record<DormStatus, string> = {
  draft: "แบบร่าง",
  published: "เผยแพร่แล้ว",
  archived: "ปิดประกาศ",
};

export const AMENITIES = [
  { key: "air_conditioner", label: "แอร์" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "water_heater", label: "เครื่องทำน้ำอุ่น" },
  { key: "elevator", label: "ลิฟต์" },
  { key: "keycard", label: "คีย์การ์ด" },
  { key: "cctv", label: "กล้องวงจรปิด" },
  { key: "security_guard", label: "รปภ." },
  { key: "motorcycle_parking", label: "ที่จอดมอเตอร์ไซค์" },
  { key: "car_parking", label: "ที่จอดรถยนต์" },
  { key: "laundry", label: "เครื่องซักผ้าหยอดเหรียญ" },
  { key: "drinking_water", label: "ตู้น้ำดื่ม" },
  { key: "convenience_store", label: "ร้านสะดวกซื้อในอาคาร" },
  { key: "fitness", label: "ฟิตเนส" },
  { key: "pets_allowed", label: "เลี้ยงสัตว์ได้" },
] as const;

export type AmenityKey = (typeof AMENITIES)[number]["key"];
export const AMENITY_KEYS = AMENITIES.map((a) => a.key) as AmenityKey[];

export const FURNITURE = [
  { key: "bed", label: "เตียง" },
  { key: "mattress", label: "ที่นอน" },
  { key: "wardrobe", label: "ตู้เสื้อผ้า" },
  { key: "desk", label: "โต๊ะทำงาน" },
  { key: "chair", label: "เก้าอี้" },
  { key: "fridge", label: "ตู้เย็น" },
  { key: "tv", label: "ทีวี" },
  { key: "sofa", label: "โซฟา" },
  { key: "microwave", label: "ไมโครเวฟ" },
  { key: "balcony", label: "ระเบียง" },
] as const;

export type FurnitureKey = (typeof FURNITURE)[number]["key"];
export const FURNITURE_KEYS = FURNITURE.map((f) => f.key) as FurnitureKey[];

export const PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา",
  "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก",
  "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน",
  "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา",
  "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต",
  "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี",
  "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ",
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี",
  "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี",
  "อุบลราชธานี",
] as const;

export const ROOM_STATUSES: RoomStatus[] = ["vacant", "held", "occupied", "maintenance"];
