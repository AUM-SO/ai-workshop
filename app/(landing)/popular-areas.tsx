import Link from "next/link";
import { RiBuildingLine, RiTrainLine } from "@remixicon/react";
import { POPULAR_AREAS } from "./popular-areas-data";
import { LandingSection } from "./section";

function AreaLinks({ names }: { names: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {names.map((name) => (
        <li key={name}>
          <Link
            href={`/search?q=${encodeURIComponent(name)}`}
            data-analytics="landing_area_click"
            className="inline-flex rounded-full border border-border-button-default bg-background-primary-default px-4 py-2 text-body-medium text-text-primary outline-none transition-colors hover:border-border-button-hover hover:bg-background-secondary-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring"
          >
            {name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PopularAreas() {
  return (
    <LandingSection id="areas" title="ทำเลยอดนิยม">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="flex items-center gap-2 text-headline-semibold text-text-primary">
            <RiBuildingLine className="size-5 text-foreground-icon-secondary" aria-hidden />
            ใกล้มหาวิทยาลัย
          </h3>
          <AreaLinks names={POPULAR_AREAS.universities} />
        </div>
        <div className="flex flex-col gap-3">
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
