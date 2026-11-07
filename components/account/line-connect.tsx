"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RiLineFill } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { createLineCode, unlinkLine } from "@/app/account/actions";

interface LineConnectProps {
  linked: boolean;
  /** LINE Official Account basic id, e.g. "@dormdee". */
  botId: string | null;
}

export function LineConnect({ linked, botId }: LineConnectProps) {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ code?: string; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const result = await fn();
      if (result.error) setError(result.error);
      else if (result.code) setCode(result.code);
      else router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <RiLineFill className="size-6 text-status-lime-text" aria-hidden />
        <span className="text-headline-semibold text-text-primary">แจ้งเตือนทาง LINE</span>
      </div>
      {linked ? (
        <>
          <p className="text-body-regular text-text-secondary">เชื่อมแล้ว คุณจะได้รับแจ้งเตือนแชทและการจองทาง LINE</p>
          <Button variant="secondary" size="small" className="self-start" disabled={pending} onClick={() => run(unlinkLine)}>
            ยกเลิกการเชื่อม LINE
          </Button>
        </>
      ) : code ? (
        <ol className="flex list-decimal flex-col gap-2 ps-5 text-body-regular text-text-primary">
          <li>
            เพิ่มเพื่อน{" "}
            {botId ? (
              <a
                href={`https://line.me/R/ti/p/${encodeURIComponent(botId)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-sm text-body-medium underline outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
              >
                {botId}
              </a>
            ) : (
              "LINE ของ DormDee"
            )}
          </li>
          <li>
            ส่งรหัสนี้ในแชท:{" "}
            <span dir="ltr" className="rounded-md bg-background-tertiary-default px-2 py-0.5 font-mono text-headline-semibold tracking-widest">
              {code}
            </span>
          </li>
          <li>
            กลับมาที่หน้านี้แล้ว{" "}
            <button type="button" onClick={() => router.refresh()} className="rounded-sm text-body-medium underline outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring">
              โหลดใหม่
            </button>
          </li>
        </ol>
      ) : (
        <>
          <p className="text-body-regular text-text-secondary">รับแจ้งเตือนเมื่อมีข้อความหรือคำขอจองใหม่ ไม่ต้องเปิดเว็บค้างไว้</p>
          <Button size="small" className="self-start" disabled={pending} onClick={() => run(createLineCode)}>
            เชื่อม LINE
          </Button>
        </>
      )}
      {error ? (
        <p role="alert" className="text-caption-1-regular text-text-error-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}
