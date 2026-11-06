"use client";

import Link from "next/link";
import { RiBuilding2Line, RiLogoutBoxRLine, RiUser3Line } from "@remixicon/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badge";
import {
  Dropdown,
  DropdownDivider,
  DropdownGroup,
  DropdownItem,
  DropdownPopover,
  DropdownTrigger,
} from "@/components/base/dropdown/dropdown";
import { MENU_ITEM, MENU_ITEM_INTERACTIVE } from "@/components/base/dropdown/menu-styles";
import { signOut } from "@/app/(auth)/actions";
import { ROLE_LABEL, type UserRole } from "@/lib/auth-labels";
import { cx } from "@/utils/cx";

interface UserMenuProps {
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export function UserMenu({ name, role, avatarUrl }: UserMenuProps) {
  const initials = name.trim().charAt(0).toUpperCase() || "?";
  const isOwner = role === "owner" || role === "admin";

  return (
    <Dropdown>
      <DropdownTrigger
        aria-label="เมนูบัญชี"
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
      >
        <Avatar size="md" color="blue" initials={initials} src={avatarUrl ?? undefined} alt="" />
      </DropdownTrigger>
      <DropdownPopover aria-label="เมนูบัญชี" placement="bottom end">
        <div className="flex flex-col gap-1 px-2 py-1.5">
          <span className="truncate text-body-medium text-text-primary">{name}</span>
          <Badge className="self-start">{ROLE_LABEL[role]}</Badge>
        </div>
        <DropdownDivider />
        <DropdownGroup>
          {isOwner ? (
            <Link href="/owner" className={cx(MENU_ITEM, MENU_ITEM_INTERACTIVE)}>
              <RiBuilding2Line className="size-5 text-foreground-icon-secondary" aria-hidden />
              หอพักของฉัน
            </Link>
          ) : null}
          <Link href="/account" className={cx(MENU_ITEM, MENU_ITEM_INTERACTIVE)}>
            <RiUser3Line className="size-5 text-foreground-icon-secondary" aria-hidden />
            บัญชีของฉัน
          </Link>
        </DropdownGroup>
        <DropdownDivider />
        <DropdownItem onSelect={() => signOut()}>
          <RiLogoutBoxRLine className="size-5 text-foreground-icon-secondary" aria-hidden />
          ออกจากระบบ
        </DropdownItem>
      </DropdownPopover>
    </Dropdown>
  );
}
