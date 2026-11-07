export const REPORT_REASONS = [
  { key: "scam", label: "น่าจะเป็นมิจฉาชีพ / ขอให้โอนเงินก่อน" },
  { key: "wrong_info", label: "ข้อมูลหรือรูปไม่ตรงความจริง" },
  { key: "unavailable", label: "ห้องไม่ว่างจริง / ติดต่อไม่ได้" },
  { key: "other", label: "อื่น ๆ" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["key"];

export const REPORT_REASON_LABEL = Object.fromEntries(REPORT_REASONS.map((r) => [r.key, r.label])) as Record<ReportReason, string>;
