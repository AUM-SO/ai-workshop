import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "./auth-labels";

export type { UserRole };

export interface CurrentProfile {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
}

/** The signed-in user's profile, or null. Cached per request. */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  // Supabase checks token expiry with Date.now(), so this must run at request time.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    role: (profile?.role as UserRole | undefined) ?? "tenant",
    display_name: profile?.display_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
  };
});

/** Redirects to /login when signed out. */
export async function requireProfile(next = "/") {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent(next)}`);
  return profile;
}

/** Only allows relative in-app paths, so `next` cannot redirect off-site. */
export function safeNext(next: string | null | undefined, fallback = "/") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export { ROLE_LABEL } from "./auth-labels";
