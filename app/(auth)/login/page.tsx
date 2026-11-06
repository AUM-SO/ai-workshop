import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentProfile, safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-12">
      <Suspense>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function LoginContent({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { next } = await searchParams;
  const target = safeNext(typeof next === "string" ? next : undefined);
  if (await getCurrentProfile()) redirect(target);

  return <AuthForm mode="signin" next={target} />;
}
