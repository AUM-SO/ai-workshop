"use client";

import { useEffect } from "react";

/**
 * Reveals every `[data-reveal]` element on the page as it scrolls into view.
 * Server components only add the attribute (and an optional `--reveal-delay`);
 * this one observer does the rest. Hiding is CSS-gated on scripting and
 * reduced motion (see landing.css), so nothing stays hidden without it.
 */
export function ScrollReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.setAttribute("data-revealed", ""));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Also reveal anything already above the viewport when observing starts
          // (a page opened at #owners), so scrolling back up does not replay the whole page.
          const passed = entry.boundingClientRect.bottom < 0;
          if (!entry.isIntersecting && !passed) continue;
          entry.target.setAttribute("data-revealed", "");
          observer.unobserve(entry.target);
        }
      },
      // Start a little before the element is fully in view, so it never reveals late.
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
