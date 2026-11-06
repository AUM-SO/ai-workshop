export type UserRole = "tenant" | "owner" | "admin";

export const ROLE_LABEL: Record<UserRole, string> = {
  tenant: "ผู้เช่า",
  owner: "เจ้าของหอ",
  admin: "ผู้ดูแลระบบ",
};
