import Image from "next/image";
import { RiImageLine } from "@remixicon/react";
import { Carousel, CarouselItem } from "@/components/base/carousel/carousel";

interface GalleryProps {
  name: string;
  photos: { id: string; url: string }[];
}

/** Photo carousel: swipe on phones, arrows and dots everywhere. The first photo is the cover. */
export function Gallery({ name, photos }: GalleryProps) {
  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-3xl bg-background-tertiary-default text-foreground-icon-quaternary">
        <RiImageLine className="size-10" aria-hidden />
      </div>
    );
  }

  return (
    <Carousel aria-label={`รูปของ ${name}`} showArrows={photos.length > 1} showDots={photos.length > 1} gap={12}>
      {photos.map((photo, index) => (
        <CarouselItem key={photo.id} aria-label={`รูปที่ ${index + 1} จาก ${photos.length}`}>
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-background-tertiary-default shadow-md">
            <Image
              src={photo.url}
              alt={index === 0 ? `ภาพหน้าปกของ ${name}` : `${name} รูปที่ ${index + 1}`}
              fill
              preload={index === 0}
              sizes="(min-width: 1024px) 720px, 100vw"
              className="object-cover"
            />
          </div>
        </CarouselItem>
      ))}
    </Carousel>
  );
}
