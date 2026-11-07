"use client";

import { useState } from "react";
import { RiDeleteBinLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { AlertDialog, ModalTrigger } from "@/components/base/modal/modal";
import { deleteRoomType } from "@/app/owner/dorms/room-type-actions";

interface DeleteRoomTypeButtonProps {
  dormId: string;
  roomTypeId: string;
  name: string;
  roomCount: number;
}

export function DeleteRoomTypeButton({ dormId, roomTypeId, name, roomCount }: DeleteRoomTypeButtonProps) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <ModalTrigger>
        <Button variant="ghost" size="small" iconOnly leadingIcon={RiDeleteBinLine} aria-label={`ลบ ${name}`} />
        <AlertDialog
          title={`ลบ ${name}?`}
          description={
            roomCount > 0
              ? `ห้องประเภทนี้ ${roomCount} ห้องจะถูกลบไปด้วย กู้คืนไม่ได้`
              : "ประเภทห้องนี้จะถูกลบ กู้คืนไม่ได้"
          }
          confirmLabel="ลบ"
          cancelLabel="ยกเลิก"
          pendingLabel="กำลังลบ…"
          onConfirm={async () => {
            setError(null);
            const result = await deleteRoomType(dormId, roomTypeId);
            if (result.error) {
              setError(result.error);
              throw new Error(result.error);
            }
          }}
        />
      </ModalTrigger>
      {error ? (
        <p role="alert" className="max-w-64 text-end text-caption-1-regular text-text-error-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}
