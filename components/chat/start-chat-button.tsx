"use client";

import { use } from "react";
import { useFormStatus } from "react-dom";
import { RiChat3Line } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { startConversation } from "@/app/chat/actions";

function Submit({ children, variant }: { children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} leadingIcon={variant === "secondary" ? undefined : RiChat3Line} disabled={pending} className="w-full">
      {pending ? "กำลังเปิดแชท…" : children}
    </Button>
  );
}

/** Opens (or reuses) the tenant's chat with a dorm; with a room type it opens the booking dialog too. */
export function StartChatButton({
  dormId,
  roomTypeId,
  children,
  variant,
}: {
  dormId: string;
  roomTypeId?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <form action={startConversation.bind(null, dormId, roomTypeId)} className="contents">
      <Submit variant={variant}>{children}</Submit>
    </form>
  );
}

/** Shown after a failed start, e.g. an owner trying to chat with their own dorm. */
export function ChatUnavailableNotice({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { chat } = use(searchParams);
  if (chat !== "unavailable") return null;
  return (
    <p role="alert" className="text-caption-1-regular text-text-error-primary">
      เปิดแชทกับหอนี้ไม่ได้ (เจ้าของหอแชทกับหอของตัวเองไม่ได้)
    </p>
  );
}
