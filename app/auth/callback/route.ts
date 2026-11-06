import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";

/** OAuth and email-confirmation landing: swaps the code for a session. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (!code) return NextResponse.redirect(`${origin}/login?error=missing_code`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/login?error=callback`);

  // OAuth sign-ups carry no role metadata, so apply the one picked on /signup.
  if (searchParams.get("role") === "owner") {
    await supabase.from("profiles").update({ role: "owner" }).eq("id", data.user.id).eq("role", "tenant");
  }

  return NextResponse.redirect(`${origin}${next}`);
}
