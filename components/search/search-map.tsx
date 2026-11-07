"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { baht } from "@/lib/dorms/costs";

export interface MapDorm {
  id: string;
  name: string;
  lat: number;
  lng: number;
  min_price: number | null;
  vacant_rooms: number;
}

/** Results on a map: each dorm is a price pill linking to its page. */
export function SearchMap({ dorms }: { dorms: MapDorm[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let remove: (() => void) | undefined;

    import("leaflet").then((L) => {
      if (cancelled || !ref.current) return;
      const map = L.map(ref.current, { scrollWheelZoom: true });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const points: [number, number][] = [];
      for (const dorm of dorms) {
        points.push([dorm.lat, dorm.lng]);
        // A div icon so the pin can show the price; styled with the app's tokens.
        const icon = L.divIcon({
          className: "",
          html: `<a href="/dorms/${dorm.id}" class="inline-flex -translate-x-1/2 -translate-y-full items-center whitespace-nowrap rounded-full border border-border-button-default ${
            dorm.vacant_rooms > 0 ? "bg-background-primary-default text-text-primary" : "bg-background-tertiary-default text-text-tertiary"
          } px-2.5 py-1 text-caption-1-semibold shadow-md">${dorm.min_price != null ? baht(dorm.min_price) : "ดูหอ"}</a>`,
          iconSize: [0, 0],
        });
        L.marker([dorm.lat, dorm.lng], { icon, title: dorm.name, alt: dorm.name, keyboard: false }).addTo(map);
      }

      if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 });
      else map.setView([13.7563, 100.5018], 11);
      remove = () => map.remove();
    });

    return () => {
      cancelled = true;
      remove?.();
    };
  }, [dorms]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative z-0 h-[32rem] w-full overflow-hidden rounded-3xl border border-border-button-default bg-background-tertiary-default shadow-md"
    />
  );
}
