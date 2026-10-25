import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormSkeleton } from "@/components/auth/form-skeleton";
import { LoginForm } from "@/components/auth/forms";
import { getSessionUser, isStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthShell
      title={
        <>
          Welcome <em>back</em>
        </>
      }
      subtitle="Log in to track orders, save addresses and check out faster."
    >
      <Suspense fallback={<FormSkeleton />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function LoginContent({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { next } = await searchParams;
  const user = await getSessionUser();
  if (user) redirect(isStaff(user) ? "/admin" : "/account");
  return <LoginForm next={typeof next === "string" ? next : undefined} />;
}
