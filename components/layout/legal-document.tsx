import Link from "next/link";
import type { ReactNode } from "react";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** Contact address for legal and privacy requests, set per deployment. */
export function legalContact() {
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? null;
}

/** Shared layout for the terms and privacy pages: title, effective date, contents and numbered sections. */
export function LegalDocument({
  title,
  updated,
  intro,
  sections,
  related,
}: {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
  related: { href: string; label: string };
}) {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-title-1-semibold text-text-primary sm:text-display-4-semibold">{title}</h1>
        <p className="text-caption-1-regular text-text-tertiary">มีผลตั้งแต่ {updated}</p>
        <div className="flex flex-col gap-3 text-body-regular text-text-secondary">{intro}</div>
      </header>

      <nav aria-labelledby="toc-title" className="rounded-3xl border border-border-button-default bg-background-secondary-default p-5">
        <h2 id="toc-title" className="text-headline-semibold text-text-primary">
          สารบัญ
        </h2>
        <ol className="mt-3 grid gap-1.5 text-body-regular sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="rounded-sm text-text-secondary outline-none hover:text-text-primary hover:underline focus-visible:ring-2 focus-visible:ring-border-focus-ring"
              >
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((s, i) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="flex scroll-mt-24 flex-col gap-3">
          <h2 id={`${s.id}-title`} className="text-title-3-semibold text-text-primary">
            {i + 1}. {s.title}
          </h2>
          <div className="flex flex-col gap-3 text-body-regular text-text-primary [&_li]:ps-1 [&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-1.5 [&_ol]:ps-6 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:ps-6">
            {s.body}
          </div>
        </section>
      ))}

      <footer className="flex flex-wrap gap-x-6 gap-y-2 border-t border-separator-border pt-6 text-body-medium">
        <Link
          href={related.href}
          className="rounded-sm text-text-secondary outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring"
        >
          {related.label}
        </Link>
        <Link
          href="/"
          className="rounded-sm text-text-secondary outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring"
        >
          กลับหน้าแรก
        </Link>
      </footer>
    </article>
  );
}

/** How to reach the team, with or without a configured address. */
export function ContactLine() {
  const email = legalContact();
  return email ? (
    <>
      ติดต่อทีมงาน DormDee ได้ที่{" "}
      <a
        href={`mailto:${email}`}
        dir="ltr"
        className="rounded-sm text-body-medium underline outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
      >
        {email}
      </a>
    </>
  ) : (
    <>ติดต่อทีมงาน DormDee ผ่านช่องทางติดต่อที่ประกาศบนเว็บไซต์</>
  );
}
