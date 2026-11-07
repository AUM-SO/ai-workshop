import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role client for trusted server code only (LINE webhook and push). Bypasses
 * RLS, so never import it from a client component. Returns null when
 * SUPABASE_SECRET_KEY is not set, and callers skip the feature.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (typeof window !== "undefined" || !url || !key) return null;
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
