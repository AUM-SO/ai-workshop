// Commute search: popular destinations and rough travel-time estimates.
// Travel time is estimated from straight-line distance, a detour factor and an
// average door-to-door speed per mode. Good enough to shortlist dorms; the dorm
// page links to Google Maps for real directions.

export const PLACES = [
  { key: "chula", label: "จุฬาลงกรณ์มหาวิทยาลัย", lat: 13.7384, lng: 100.532 },
  { key: "tu-tha-prachan", label: "ม.ธรรมศาสตร์ ท่าพระจันทร์", lat: 13.7563, lng: 100.4904 },
  { key: "tu-rangsit", label: "ม.ธรรมศาสตร์ รังสิต", lat: 14.0697, lng: 100.605 },
  { key: "ku-bangkhen", label: "ม.เกษตรศาสตร์ บางเขน", lat: 13.8476, lng: 100.5696 },
  { key: "mahidol-salaya", label: "ม.มหิดล ศาลายา", lat: 13.7934, lng: 100.3225 },
  { key: "swu-prasarnmit", label: "ม.ศรีนครินทรวิโรฒ ประสานมิตร", lat: 13.7445, lng: 100.5653 },
  { key: "kmitl", label: "สจล. ลาดกระบัง", lat: 13.7299, lng: 100.7782 },
  { key: "kmutt", label: "มจธ. บางมด", lat: 13.6512, lng: 100.4943 },
  { key: "ru", label: "ม.รามคำแหง", lat: 13.7574, lng: 100.6214 },
  { key: "cmu", label: "ม.เชียงใหม่", lat: 18.8037, lng: 98.9525 },
  { key: "kku", label: "ม.ขอนแก่น", lat: 16.4747, lng: 102.8236 },
  { key: "psu-hatyai", label: "ม.สงขลานครินทร์ หาดใหญ่", lat: 7.0067, lng: 100.4987 },
  { key: "siam", label: "สยาม (BTS สยาม)", lat: 13.7456, lng: 100.5341 },
  { key: "asok", label: "อโศก / สุขุมวิท", lat: 13.737, lng: 100.5603 },
  { key: "silom", label: "สีลม / สาทร", lat: 13.7247, lng: 100.53 },
  { key: "victory-monument", label: "อนุสาวรีย์ชัยสมรภูมิ", lat: 13.7649, lng: 100.5383 },
  { key: "rama9", label: "รัชดา / พระราม 9", lat: 13.7578, lng: 100.565 },
  { key: "nimman", label: "นิมมานเหมินท์ เชียงใหม่", lat: 18.799, lng: 98.968 },
] as const;

export type PlaceKey = (typeof PLACES)[number]["key"];

export const MODES = {
  transit: { label: "รถสาธารณะ", kmh: 14 },
  motorbike: { label: "มอเตอร์ไซค์", kmh: 22 },
  car: { label: "รถยนต์", kmh: 18 },
  walk: { label: "เดิน", kmh: 4.5 },
} as const;

export type CommuteMode = keyof typeof MODES;

export const MINUTES = [10, 15, 20, 30, 45, 60] as const;

/** Roads are longer than a straight line. */
const DETOUR = 1.35;

export const placeByKey = (key: string) => PLACES.find((p) => p.key === key) ?? null;

/** Largest straight-line distance that still fits the time budget. */
export function maxKmFor(mode: CommuteMode, minutes: number) {
  return (MODES[mode].kmh * minutes) / 60 / DETOUR;
}

/** Estimated door-to-door minutes for a straight-line distance, rounded up to 5. */
export function estimateMinutes(distanceKm: number, mode: CommuteMode) {
  const minutes = ((distanceKm * DETOUR) / MODES[mode].kmh) * 60;
  return Math.max(5, Math.ceil(minutes / 5) * 5);
}
