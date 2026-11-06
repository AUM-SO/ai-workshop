import Link from "next/link";
import { RiHome4Line } from "@remixicon/react";
import { ButtonLink } from "@/components/base/buttons/button";
import { ThemeToggle } from "@/components/application/theme/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-separator-border bg-background-primary-default">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-headline-semibold text-text-primary">
          <RiHome4Line className="size-6 text-accent-500" aria-hidden />
          DormDee
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="เมนูหลัก">
          <ButtonLink href="/search" variant="ghost" size="small">
            ค้นหาหอพัก
          </ButtonLink>
          <ButtonLink href="/owner" variant="ghost" size="small">
            สำหรับเจ้าของหอ
          </ButtonLink>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <ThemeToggle appearance="segmented" size="small" className="hidden sm:flex" />
          <ButtonLink href="/login" variant="ghost" size="small">
            เข้าสู่ระบบ
          </ButtonLink>
          <ButtonLink href="/signup" size="small">
            สมัครสมาชิก
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
