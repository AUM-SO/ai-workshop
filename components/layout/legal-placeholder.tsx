import Link from "next/link";

/** Placeholder for legal pages until the real text is written (PDPA requires both pages to exist). */
export function LegalPlaceholder({ title }: { title: string }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-16">
      <h1 className="text-title-1-semibold text-text-primary sm:text-display-4-semibold">{title}</h1>
      <p className="text-body-regular text-text-secondary">
        เนื้อหาหน้านี้อยู่ระหว่างจัดทำ หากมีคำถามเกี่ยวกับข้อมูลส่วนบุคคลหรือการใช้งาน กรุณาติดต่อทีมงาน DormDee
      </p>
      <Link
        href="/"
        className="self-start rounded-sm text-body-medium text-text-secondary outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring"
      >
        กลับหน้าแรก
      </Link>
    </div>
  );
}
