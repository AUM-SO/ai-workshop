import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/utils/cx";

/** Inline style that staggers list items for ScrollReveal: 80ms apart, capped so long lists do not drag. */
export function revealDelay(index: number) {
  return { "--reveal-delay": `${Math.min(index, 5) * 80}ms` } as CSSProperties;
}

interface LandingSectionProps {
  /** Anchor id; the heading gets `${id}-title`. */
  id: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Shared frame for landing sections: width, spacing, and an H2 the section is labelled by. */
export function LandingSection({ id, title, description, children, className }: LandingSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cx("mx-auto flex w-full max-w-6xl scroll-mt-20 flex-col gap-8 px-4 py-12 sm:py-16", className)}
    >
      <div data-reveal className="flex max-w-2xl flex-col gap-3">
        <h2 id={`${id}-title`} className="text-title-1-semibold text-text-primary sm:text-display-4-semibold">
          {title}
        </h2>
        {description ? <p className="text-title-3-regular text-text-secondary">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Small "coming soon" tag for features that have not shipped yet. */
export function ComingSoon() {
  return (
    <span className="inline-flex items-center rounded-full bg-background-tertiary-default px-2 py-0.5 text-caption-1-medium whitespace-nowrap text-text-secondary">
      เร็ว ๆ นี้
    </span>
  );
}
