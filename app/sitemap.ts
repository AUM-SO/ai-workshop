import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { DORMS_TAG } from "@/lib/dorms/public";
import { createAnonClient } from "@/lib/supabase/anon";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

async function publishedDorms() {
  "use cache";
  cacheTag(DORMS_TAG);
  cacheLife("hours");
  try {
    const { data } = await createAnonClient().from("dorms").select("id, updated_at").eq("status", "published");
    return data ?? [];
  } catch {
    // Supabase unreachable (for example in a CI build): list the static pages only.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dorms = await publishedDorms();
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: "daily", priority: 0.8 },
    ...dorms.map((dorm) => ({
      url: `${SITE_URL}/dorms/${dorm.id}`,
      lastModified: new Date(dorm.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
