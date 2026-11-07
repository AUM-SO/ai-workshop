"use client";

import { useState, useTransition } from "react";
import { RiNotification3Line, RiNotificationOffLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { toggleWatch } from "@/app/dorms/actions";

/** "Tell me when a room of this type is free". One notification, then it switches off. */
export function WatchButton({ dormId, roomTypeId, initialWatching }: { dormId: string; roomTypeId: string; initialWatching: boolean }) {
  const [watching, setWatching] = useState(initialWatching);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      const next = !watching;
      setError(null);
      const result = await toggleWatch(dormId, roomTypeId, next);
      if (result.error) setError(result.error);
      else setWatching(next);
    });

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="secondary"
        className="w-full"
        leadingIcon={watching ? RiNotificationOffLine : RiNotification3Line}
        disabled={pending}
        onClick={toggle}
        aria-pressed={watching}
      >
        {watching ? "เลิกติดตามห้องว่าง" : "แจ้งเตือนเมื่อมีห้องว่าง"}
      </Button>
      <p className="text-caption-1-regular text-text-tertiary">
        {watching ? "เราจะแจ้งเตือนคุณครั้งเดียวเมื่อห้องแบบนี้ว่าง" : "ห้องแบบนี้เต็มแล้ว กดติดตามเพื่อรับแจ้งเตือนเมื่อว่าง"}
      </p>
      {error ? (
        <p role="alert" className="text-caption-1-regular text-text-error-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}
