import { AMENITIES } from "@/lib/dorms/options";
import type { PublicDorm } from "@/lib/dorms/public";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const amenityLabel = new Map<string, string>(AMENITIES.map((a) => [a.key, a.label]));
const absolute = (url: string) => (url.startsWith("http") ? url : `${SITE_URL}${url}`);

/** Structured data for search engines: the dorm as a lodging business with its rent range. */
export function DormJsonLd({ data }: { data: PublicDorm }) {
  const { dorm, photos, roomTypes } = data;
  const prices = roomTypes.map((t) => t.monthly_price);
  const graph = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": `${SITE_URL}/dorms/${dorm.id}`,
    name: dorm.name,
    description: dorm.description ?? undefined,
    url: `${SITE_URL}/dorms/${dorm.id}`,
    image: photos.slice(0, 5).map((p) => absolute(p.url)),
    address: {
      "@type": "PostalAddress",
      streetAddress: dorm.address ?? undefined,
      addressLocality: dorm.district ?? undefined,
      addressRegion: dorm.province ?? undefined,
      addressCountry: "TH",
    },
    geo: dorm.lat != null && dorm.lng != null ? { "@type": "GeoCoordinates", latitude: dorm.lat, longitude: dorm.lng } : undefined,
    priceRange: prices.length ? `฿${Math.min(...prices).toLocaleString("en-US")}–฿${Math.max(...prices).toLocaleString("en-US")} per month` : undefined,
    amenityFeature: dorm.amenities.map((key) => ({
      "@type": "LocationFeatureSpecification",
      name: amenityLabel.get(key) ?? key,
      value: true,
    })),
  };

  return (
    <script
      type="application/ld+json"
      // Escape "<" so the payload can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
    />
  );
}
