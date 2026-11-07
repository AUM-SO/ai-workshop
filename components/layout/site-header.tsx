import { Suspense } from "react";
import Link from "next/link";
import { RiChat3Line, RiHome4Line } from "@remixicon/react";
import { ButtonLink } from "@/components/base/buttons/button";
import { ThemeToggle } from "@/components/application/theme/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
          <ButtonLink href="/roommates" variant="ghost" size="small">
            หาเพื่อนร่วมห้อง
          </ButtonLink>
          {/* Explains the owner offer first; signed-in owners reach /owner from the account menu. */}
          <ButtonLink href="/?for=owner#owners" variant="ghost" size="small">
            สำหรับเจ้าของหอ
          </ButtonLink>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <ThemeToggle appearance="segmented" size="small" className="hidden sm:flex" />
          {/* The session is a request-time read, so it streams in behind the static header. */}
          <Suspense fallback={<div className="size-8" aria-hidden />}>
            <HeaderAccount />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function HeaderAccount() {
  const profile = await getCurrentProfile();

  if (profile) {
    const supabase = await createClient();
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20);
    return (
      <>
        <ButtonLink href="/chat" variant="ghost" size="small" iconOnly leadingIcon={RiChat3Line} aria-label="แชท" />
        <NotificationBell userId={profile.id} initial={notifications ?? []} />
        <UserMenu name={profile.display_name || profile.email} role={profile.role} avatarUrl={profile.avatar_url} />
      </>
    );
  }

  return (
    <>
      <ButtonLink href="/login" variant="ghost" size="small">
        เข้าสู่ระบบ
      </ButtonLink>
      <ButtonLink href="/signup" size="small">
        สมัครสมาชิก
      </ButtonLink>
    </>
  );
}
