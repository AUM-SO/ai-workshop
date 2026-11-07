import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "DormDee – หาหอพัก ห้องว่างจริง จองผ่านแชท";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse renders outside the browser, so the BoardUI CSS tokens are not available here.
// These literals mirror the light theme: background-full, text-primary, text-secondary, accent-500,
// and the vacant / held / occupied room status colours.
const COLORS = {
  background: "#f7f7f8",
  surface: "#ffffff",
  text: "#18181b",
  muted: "#52525b",
  accent: "#3b82f6",
  vacant: "#d9f99d",
  held: "#fef08a",
  occupied: "#e4e4e7",
};

const ROOMS = ["occupied", "vacant", "held", "occupied", "vacant", "occupied", "vacant", "occupied", "occupied", "vacant", "held", "vacant"] as const;

export default async function Image() {
  const fontDir = join(process.cwd(), "assets/fonts");
  // Noto Sans Thai ships Thai and Latin glyphs as separate subsets; Satori falls back between them.
  const [thai, latin] = await Promise.all([
    readFile(join(fontDir, "noto-sans-thai-thai-600-normal.woff")),
    readFile(join(fontDir, "noto-sans-thai-latin-600-normal.woff")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: 80,
          background: COLORS.background,
          fontFamily: "Noto Sans Thai",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28, flex: 1 }}>
          <div style={{ display: "flex", fontSize: 40, color: COLORS.accent }}>DormDee</div>
          <div style={{ display: "flex", fontSize: 64, lineHeight: 1.25, color: COLORS.text }}>
            หาหอพักที่ว่างจริง และจองได้ทันทีผ่านแชท
          </div>
          <div style={{ display: "flex", fontSize: 30, color: COLORS.muted }}>ห้องว่างจริง · ค่าใช้จ่ายโปร่งใส · จองผ่านแชท</div>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            width: 360,
            padding: 28,
            borderRadius: 32,
            background: COLORS.surface,
          }}
        >
          {ROOMS.map((status, index) => (
            <div key={index} style={{ width: 92, height: 64, borderRadius: 14, background: COLORS[status] }} />
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Sans Thai", data: thai, style: "normal", weight: 600 },
        { name: "Noto Sans Thai", data: latin, style: "normal", weight: 600 },
      ],
    },
  );
}
