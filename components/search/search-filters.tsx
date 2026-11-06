"use client";

import { CheckboxGroup } from "react-aria-components";
import { RiFilter3Line, RiSearchLine } from "@remixicon/react";
import { Accordion, AccordionItem } from "@/components/base/accordion/accordion";
import { Button, ButtonLink } from "@/components/base/buttons/button";
import { CheckboxCard } from "@/components/base/checkbox/checkbox-card";
import { NumberField } from "@/components/base/number-field/number-field";
import { SearchField } from "@/components/base/search-field/search-field";
import { Select, SelectItem } from "@/components/base/select/select";
import { Switch } from "@/components/base/switch/switch";
import { AMENITIES, GENDER_POLICY_LABEL, PROVINCES, type GenderPolicy } from "@/lib/dorms/options";
import type { SearchFilters as Filters } from "@/lib/dorms/search-params";

const THB = { style: "currency", currency: "THB", maximumFractionDigits: 0 } as const;

/**
 * The search form. It is a plain GET form, so every filter lives in the URL:
 * results can be shared, bookmarked and reached without JavaScript.
 */
export function SearchFilters({ filters }: { filters: Filters }) {
  const extraCount = filters.amenities.length + (filters.min ? 1 : 0) + (filters.max ? 1 : 0);

  return (
    <form action="/search" method="get" role="search" className="flex flex-col gap-4">
      {/* Keep the chosen order and view when filters change; paging restarts. */}
      {filters.sort !== "relevance" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
      {filters.view === "map" ? <input type="hidden" name="view" value="map" /> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchField
          name="q"
          aria-label="ค้นหาหอพัก"
          placeholder="ชื่อหอ มหาวิทยาลัย สถานี BTS/MRT หรือย่าน"
          clearLabel="ล้างคำค้นหา"
          defaultValue={filters.q}
          className="flex-1"
        />
        <Button type="submit" leadingIcon={RiSearchLine}>
          ค้นหา
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
        <Select name="province" aria-label="จังหวัด" defaultSelectedKey={filters.province ?? "all"} triggerClassName="w-full">
          <SelectItem id="all" textValue="ทุกจังหวัด">
            ทุกจังหวัด
          </SelectItem>
          {PROVINCES.map((p) => (
            <SelectItem key={p} id={p} textValue={p}>
              {p}
            </SelectItem>
          ))}
        </Select>
        <Select name="gender" aria-label="ประเภทหอ" defaultSelectedKey={filters.gender ?? "all"} triggerClassName="w-full">
          <SelectItem id="all" textValue="ทุกประเภทหอ">
            ทุกประเภทหอ
          </SelectItem>
          {(Object.keys(GENDER_POLICY_LABEL) as GenderPolicy[]).map((g) => (
            <SelectItem key={g} id={g} textValue={GENDER_POLICY_LABEL[g]}>
              {GENDER_POLICY_LABEL[g]}
            </SelectItem>
          ))}
        </Select>
        <Switch name="vacant" value="1" defaultSelected={filters.vacant} className="self-center">
          มีห้องว่างเท่านั้น
        </Switch>
      </div>

      <Accordion variant="separated" defaultExpandedKeys={extraCount ? ["more"] : []}>
        <AccordionItem
          id="more"
          icon={RiFilter3Line}
          title={extraCount ? `ตัวกรองเพิ่มเติม (${extraCount})` : "ตัวกรองเพิ่มเติม"}
          headingLevel={2}
        >
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField
                name="min"
                label="ค่าเช่าต่ำสุด"
                defaultValue={filters.min ?? undefined}
                minValue={0}
                step={500}
                formatOptions={THB}
              />
              <NumberField
                name="max"
                label="ค่าเช่าสูงสุด"
                defaultValue={filters.max ?? undefined}
                minValue={0}
                step={500}
                formatOptions={THB}
              />
            </div>
            <CheckboxGroup
              name="amenities"
              aria-label="สิ่งอำนวยความสะดวกที่ต้องมี"
              defaultValue={filters.amenities}
              className="flex flex-col gap-2"
            >
              <span className="text-body-medium text-text-secondary">ต้องมี</span>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {AMENITIES.map((a) => (
                  <CheckboxCard key={a.key} value={a.key} title={a.label} />
                ))}
              </div>
            </CheckboxGroup>
          </div>
        </AccordionItem>
      </Accordion>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="secondary">
          ใช้ตัวกรอง
        </Button>
        <ButtonLink href={filters.view === "map" ? "/search?view=map" : "/search"} variant="ghost">
          ล้างตัวกรอง
        </ButtonLink>
      </div>
    </form>
  );
}
