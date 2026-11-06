import { ButtonLink } from "@/components/base/buttons/button";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
      <div data-reveal className="flex flex-col items-start gap-6 rounded-3xl border border-border-button-default bg-background-secondary-default p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
        <div className="flex flex-col gap-2">
          <h2 id="final-cta-title" className="text-title-1-semibold text-text-primary sm:text-display-4-semibold">
            พร้อมหาห้องหรือยัง
          </h2>
          <p className="text-body-regular text-text-secondary">ค้นหาหอที่ว่างจริงใกล้คุณ หรือเริ่มลงประกาศหอของคุณวันนี้</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/search">ค้นหาหอพัก</ButtonLink>
          <ButtonLink href="/signup?role=owner" variant="secondary" data-analytics="landing_owner_cta_click">
            ลงประกาศหอพักฟรี
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
