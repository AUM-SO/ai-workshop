"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, CircleMarker } from "leaflet";
import { RiCrosshair2Line, RiDeleteBinLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import "leaflet/dist/leaflet.css";

// Bangkok, shown until the owner places a pin.
const DEFAULT_CENTER: [number, number] = [13.7563, 100.5018];

interface LocationPickerProps {
  defaultLat?: number | null;
  defaultLng?: number | null;
  /** Field names posted with the form. */
  latName?: string;
  lngName?: string;
  errorMessage?: string;
}

/**
 * Click (or tap) the map to drop the dorm's pin; drag it to adjust.
 * The coordinates post as hidden inputs, so this works inside a plain form.
 */
export function LocationPicker({
  defaultLat = null,
  defaultLng = null,
  latName = "lat",
  lngName = "lng",
  errorMessage,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<CircleMarker | null>(null);
  const placeRef = useRef<((lat: number, lng: number) => void) | null>(null);
  const [point, setPoint] = useState<[number, number] | null>(
    defaultLat != null && defaultLng != null ? [defaultLat, defaultLng] : null,
  );
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Leaflet touches `window`, so it is imported only in the browser.
  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | undefined;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;
      map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(point ?? DEFAULT_CENTER, point ? 16 : 11);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const place = (lat: number, lng: number) => {
        // A circle marker needs no image assets, unlike Leaflet's default pin.
        if (!markerRef.current) {
          // Leaflet paints SVG attributes, so read the accent token rather than hard-coding a colour.
          const accent = getComputedStyle(document.documentElement).getPropertyValue("--color-accent-600").trim();
          markerRef.current = L.circleMarker([lat, lng], {
            radius: 10,
            weight: 3,
            color: accent,
            fillColor: accent,
            fillOpacity: 0.85,
          }).addTo(map!);
        } else {
          markerRef.current.setLatLng([lat, lng]);
        }
        setPoint([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
      };

      if (point) place(point[0], point[1]);
      map.on("click", (event) => place(event.latlng.lat, event.latlng.lng));
      mapRef.current = map;
      placeRef.current = place;
    });

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      markerRef.current = null;
      placeRef.current = null;
    };
    // The map is created once; later pin changes go through `place`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("เบราว์เซอร์นี้หาตำแหน่งไม่ได้ ปักหมุดบนแผนที่แทน");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        placeRef.current?.(coords.latitude, coords.longitude);
        mapRef.current?.setView([coords.latitude, coords.longitude], 17);
      },
      () => {
        setLocating(false);
        setGeoError("หาตำแหน่งไม่ได้ ตรวจสิทธิ์การเข้าถึงตำแหน่ง หรือปักหมุดบนแผนที่แทน");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const clear = () => {
    markerRef.current?.remove();
    markerRef.current = null;
    setPoint(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-body-medium text-text-secondary">ตำแหน่งบนแผนที่</span>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="small" leadingIcon={RiCrosshair2Line} onClick={useMyLocation} disabled={locating}>
            {locating ? "กำลังหาตำแหน่ง…" : "ใช้ตำแหน่งปัจจุบัน"}
          </Button>
          {point ? (
            <Button type="button" variant="ghost" size="small" leadingIcon={RiDeleteBinLine} onClick={clear}>
              ล้างหมุด
            </Button>
          ) : null}
        </div>
      </div>

      {/* The map is a mouse/touch convenience; the coordinates below are announced for everyone. */}
      <div
        ref={containerRef}
        aria-hidden
        className="relative z-0 h-72 w-full overflow-hidden rounded-2xl border border-border-button-default bg-background-tertiary-default"
      />

      <p aria-live="polite" className="text-caption-1-regular text-text-tertiary">
        {point ? (
          <>
            ปักหมุดแล้วที่ <span dir="ltr" className="tabular-nums">{point[0]}, {point[1]}</span> แตะแผนที่เพื่อย้ายหมุด
          </>
        ) : (
          "แตะบนแผนที่เพื่อปักหมุดตำแหน่งหอ ผู้เช่าจะใช้หมุดนี้ค้นหาหอใกล้ที่เรียนหรือที่ทำงาน"
        )}
      </p>
      {geoError || errorMessage ? (
        <p className="text-caption-1-regular text-text-error-primary">{geoError ?? errorMessage}</p>
      ) : null}

      <input type="hidden" name={latName} value={point?.[0] ?? ""} />
      <input type="hidden" name={lngName} value={point?.[1] ?? ""} />
    </div>
  );
}
