import { RiStarFill, RiStarLine } from "@remixicon/react";
import { cx } from "@/utils/cx";

/** Read-only 1–5 star display. */
export function Stars({ value, className }: { value: number; className?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={cx("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value.toFixed(1)} จาก 5 ดาว`}>
      {[1, 2, 3, 4, 5].map((n) =>
        n <= rounded ? (
          <RiStarFill key={n} className="size-4 text-status-yellow-text" aria-hidden />
        ) : (
          <RiStarLine key={n} className="size-4 text-foreground-icon-quaternary" aria-hidden />
        ),
      )}
    </span>
  );
}
