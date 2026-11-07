"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  lat: number;
  lng: number;
  /** Accessible description of what the map shows. */
  label: string;
  className?: string;
}

/** A read-only map with one pin. Dragging is on, scroll-zoom is off so the page scrolls normally. */
export function LocationMap({ lat, lng, label, className }: LocationMapProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let remove: (() => void) | undefined;

    import("leaflet").then((L) => {
      if (cancelled || !ref.current) return;
      const map = L.map(ref.current, { scrollWheelZoom: false }).setView([lat, lng], 16);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      // Leaflet paints SVG attributes, so read the accent token rather than hard-coding a colour.
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--color-accent-600").trim();
      L.circleMarker([lat, lng], { radius: 10, weight: 3, color: accent, fillColor: accent, fillOpacity: 0.85 }).addTo(map);
      remove = () => map.remove();
    });

    return () => {
      cancelled = true;
      remove?.();
    };
  }, [lat, lng]);

  return <div ref={ref} role="img" aria-label={label} className={className} />;
}
