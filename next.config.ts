import type { NextConfig } from "next";

// Dorm photos are served from Supabase Storage; only that bucket's public path is allowed.
const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321");
const isLocalSupabase = ["127.0.0.1", "localhost"].includes(supabaseUrl.hostname);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [new URL("/storage/v1/object/public/dorm-photos/**", supabaseUrl)],
    // The local Supabase stack runs on 127.0.0.1; production storage is never a local address.
    dangerouslyAllowLocalIP: isLocalSupabase && process.env.NODE_ENV !== "production",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
