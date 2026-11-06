import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import btsPhoto from "@/assets/images/landing/bts-skytrain.jpg";
import campusPhoto from "@/assets/images/landing/university-campus.jpg";
import { RiBuildingLine, RiTrainLine } from "@remixicon/react";
import { POPULAR_AREAS } from "./popular-areas-data";
import { LandingSection, revealDelay } from "./section";

function AreaLinks({ names }: { names: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {names.map((name) => (
        <li key={name}>
          <Link
            href={`/search?q=${encodeURIComponent(name)}`}
            data-analytics="landing_area_click"
            className="inline-flex rounded-full border border-border-button-default bg-background-primary-default px-4 py-2 text-body-medium text-text-primary shadow-xs outline-none transition-[translate,background-color,border-color,box-shadow] duration-200 ease-out hover:border-border-button-hover hover:shadow-md motion-safe:hover:-translate-y-0.5 hover:bg-background-secondary-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring"
          >
            {name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AreaPhoto({ src, alt }: { src: StaticImageData; alt: string }) {
  return (
    <div className="group relative aspect-[2/1] overflow-hidden rounded-3xl bg-background-tertiary-default shadow-md">
      <Image
        src={src}
        alt={alt}
        fill
        placeholder="blur"
        sizes="(min-width: 1024px) 560px, 100vw"
        className="object-cover transition-[scale] duration-700 ease-out motion-safe:group-hover:scale-105"
      />
    </div>
  );
}

export function PopularAreas() {
  return (
    <LandingSection id="areas" title="ทำเลยอดนิยม">
      <div className="grid gap-8 lg:grid-cols-2">
        <div data-reveal className="flex flex-col gap-4">
          <AreaPhoto src={campusPhoto} alt="นักศึกษาเดินผ่านซุ้มประตูในมหาวิทยาลัย" />
          <h3 className="flex items-center gap-2 text-headline-semibold text-text-primary">
            <RiBuildingLine className="size-5 text-foreground-icon-secondary" aria-hidden />
            ใกล้มหาวิทยาลัย
          </h3>
          <AreaLinks names={POPULAR_AREAS.universities} />
        </div>
        <div data-reveal style={revealDelay(1)} className="flex flex-col gap-4">
          <AreaPhoto src={btsPhoto} alt="รถไฟฟ้า BTS วิ่งบนรางยกระดับท่ามกลางตึกสูงในกรุงเทพฯ" />
          <h3 className="flex items-center gap-2 text-headline-semibold text-text-primary">
            <RiTrainLine className="size-5 text-foreground-icon-secondary" aria-hidden />
            ใกล้รถไฟฟ้า
          </h3>
          <AreaLinks names={POPULAR_AREAS.stations} />
        </div>
      </div>
    </LandingSection>
  );
}
