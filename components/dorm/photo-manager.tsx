"use client";

import { useId, useOptimistic, useRef, useState, useTransition, type DragEvent } from "react";
import Image from "next/image";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiDeleteBinLine,
  RiImageAddLine,
  RiStarLine,
} from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Chip } from "@/components/base/badges/chip";
import { addDormPhotos, deleteDormPhoto, reorderDormPhotos } from "@/app/owner/dorms/photo-actions";
import { MAX_PHOTOS } from "@/lib/dorms/options";
import { compressImage } from "@/lib/images/compress";
import { createClient } from "@/lib/supabase/client";
import { cx } from "@/utils/cx";

export interface DormPhoto {
  id: string;
  url: string;
}

interface PhotoManagerProps {
  dormId: string;
  ownerId: string;
  photos: DormPhoto[];
}

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_INPUT_BYTES = 20 * 1024 * 1024; // before compression

type Upload = { name: string; state: "working" | "error"; message?: string };

export function PhotoManager({ dormId, ownerId, photos }: PhotoManagerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  // Reorders and deletes show at once; the server's answer replaces them when it arrives.
  const [optimistic, setOptimistic] = useOptimistic(photos);

  const room = MAX_PHOTOS - photos.length;

  const upload = async (files: File[]) => {
    setError(null);
    setStatus(null);
    const images = files.filter((f) => ACCEPT.includes(f.type));
    if (images.length < files.length) setError("รองรับเฉพาะไฟล์ JPG, PNG และ WebP");
    const tooBig = images.filter((f) => f.size > MAX_INPUT_BYTES);
    if (tooBig.length) setError("ไฟล์ใหญ่เกิน 20MB บางไฟล์ถูกข้ามไป");
    const batch = images.filter((f) => f.size <= MAX_INPUT_BYTES).slice(0, Math.max(room, 0));
    if (images.length > room) setError(`เพิ่มได้อีก ${room} รูป (สูงสุด ${MAX_PHOTOS} รูปต่อหอ)`);
    if (batch.length === 0) return;

    setUploads(batch.map((f) => ({ name: f.name, state: "working" })));
    const supabase = createClient();
    const paths: string[] = [];

    await Promise.all(
      batch.map(async (file, index) => {
        try {
          const blob = await compressImage(file);
          const path = `${ownerId}/${dormId}/${crypto.randomUUID()}.webp`;
          const { error: uploadError } = await supabase.storage
            .from("dorm-photos")
            .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
          if (uploadError) throw uploadError;
          paths.push(path);
        } catch {
          setUploads((list) =>
            list.map((u, i) => (i === index ? { ...u, state: "error", message: "อัปโหลดไม่สำเร็จ" } : u)),
          );
        }
      }),
    );

    if (paths.length) {
      const result = await addDormPhotos(dormId, paths);
      if (result.error) setError(result.error);
      else setStatus(result.message ?? null);
    }
    setUploads((list) => list.filter((u) => u.state === "error"));
    if (inputRef.current) inputRef.current.value = "";
  };

  const reorder = (next: DormPhoto[]) =>
    startTransition(async () => {
      setOptimistic(next);
      const result = await reorderDormPhotos(dormId, next.map((p) => p.id));
      if (result.error) setError(result.error);
    });

  const move = (index: number, delta: number) => {
    const next = [...optimistic];
    const [photo] = next.splice(index, 1);
    next.splice(index + delta, 0, photo);
    reorder(next);
  };

  const makeCover = (index: number) => {
    const next = [...optimistic];
    const [photo] = next.splice(index, 1);
    reorder([photo, ...next]);
  };

  const remove = (photo: DormPhoto) =>
    startTransition(async () => {
      setError(null);
      setOptimistic(optimistic.filter((p) => p.id !== photo.id));
      const result = await deleteDormPhoto(dormId, photo.id);
      if (result.error) setError(result.error);
    });

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    void upload([...event.dataTransfer.files]);
  };

  const busy = uploads.some((u) => u.state === "working");

  return (
    <div className="flex flex-col gap-5">
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cx(
          "flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-border-focus-ring",
          dragging
            ? "border-accent-500 bg-background-secondary-hover"
            : "border-border-button-default bg-background-secondary-default hover:bg-background-secondary-hover",
          (room <= 0 || busy) && "pointer-events-none opacity-60",
        )}
      >
        <RiImageAddLine className="size-8 text-foreground-icon-secondary" aria-hidden />
        <span className="text-body-medium text-text-primary">
          {busy ? "กำลังอัปโหลด…" : "ลากรูปมาวาง หรือกดเพื่อเลือกรูป"}
        </span>
        <span className="text-caption-1-regular text-text-tertiary">
          JPG, PNG หรือ WebP ไม่เกิน 20MB ต่อรูป ระบบย่อรูปให้อัตโนมัติ · เหลืออีก {Math.max(room, 0)} รูป
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT.join(",")}
          multiple
          disabled={room <= 0 || busy}
          className="sr-only"
          onChange={(event) => void upload([...(event.target.files ?? [])])}
        />
      </label>

      <div aria-live="polite" className="flex flex-col gap-1 text-body-regular">
        {uploads.map((u, i) => (
          <span key={`${u.name}-${i}`} className={u.state === "error" ? "text-text-error-primary" : "text-text-secondary"}>
            {u.name}: {u.state === "error" ? u.message : "กำลังย่อและอัปโหลด…"}
          </span>
        ))}
        {error ? <span className="text-text-error-primary">{error}</span> : null}
        {status ? <span className="text-text-secondary">{status}</span> : null}
      </div>

      {optimistic.length === 0 ? (
        <p className="text-body-regular text-text-secondary">
          ยังไม่มีรูป รูปแรกจะเป็นรูปปกของหอ แนะนำให้มีรูปด้านหน้าอาคาร ห้องพัก ห้องน้ำ และสิ่งอำนวยความสะดวก
        </p>
      ) : (
        <ol className={cx("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", pending && "opacity-80")} aria-label="รูปของหอ เรียงตามลำดับที่แสดง">
          {optimistic.map((photo, index) => (
            <li
              key={photo.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border-button-default bg-background-primary-default"
            >
              <div className="relative aspect-[4/3] bg-background-tertiary-default">
                {/* Storage URLs are served as they are; optimisation comes with the public pages. */}
                <Image
                  src={photo.url}
                  alt={`รูปที่ ${index + 1}`}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 320px, 50vw"
                  className="object-cover"
                />
                {index === 0 ? (
                  <Chip color="blue" variant="caption" className="absolute start-2 top-2">
                    รูปปก
                  </Chip>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="small"
                    iconOnly
                    leadingIcon={RiArrowLeftLine}
                    aria-label={`เลื่อนรูปที่ ${index + 1} ไปก่อนหน้า`}
                    disabled={index === 0 || pending}
                    onClick={() => move(index, -1)}
                  />
                  <Button
                    variant="ghost"
                    size="small"
                    iconOnly
                    leadingIcon={RiArrowRightLine}
                    aria-label={`เลื่อนรูปที่ ${index + 1} ไปถัดไป`}
                    disabled={index === optimistic.length - 1 || pending}
                    onClick={() => move(index, 1)}
                  />
                </div>
                <div className="flex gap-1">
                  {index > 0 ? (
                    <Button variant="ghost" size="small" leadingIcon={RiStarLine} disabled={pending} onClick={() => makeCover(index)}>
                      ตั้งเป็นรูปปก
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="small"
                    iconOnly
                    leadingIcon={RiDeleteBinLine}
                    aria-label={`ลบรูปที่ ${index + 1}`}
                    disabled={pending}
                    onClick={() => remove(photo)}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
