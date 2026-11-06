import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * A cookie-less client that reads as an anonymous visitor. Use it inside `"use cache"`
 * functions: cached output must not depend on who is signed in, and RLS then limits
 * reads to public (published) data.
 */
export function createAnonClient() {
  const { url, key } = supabaseEnv();
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
