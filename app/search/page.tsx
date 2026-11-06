import type { Metadata } from "next";

export const metadata: Metadata = { title: "ค้นหาหอพัก" };

export default function SearchPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-12">
      <h1 className="text-title-2-medium text-text-primary">ค้นหาหอพัก</h1>
      <p className="text-body-regular text-text-secondary">หน้าค้นหาจะเปิดใช้ใน Phase 2</p>
    </div>
  );
}
