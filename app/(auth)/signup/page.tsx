import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "สมัครสมาชิก" };

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-12">
      <Suspense>
        <SignupContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SignupContent({ searchParams }: Pick<PageProps<"/signup">, "searchParams">) {
  const { role } = await searchParams;
  if (await getCurrentProfile()) redirect("/");

  return <AuthForm mode="signup" initialRole={role === "owner" ? "owner" : "tenant"} />;
}
