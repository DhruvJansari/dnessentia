import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormSkeleton } from "@/components/auth/form-skeleton";
import { RegisterForm } from "@/components/auth/forms";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <AuthShell
      title={
        <>
          Join <em>DN Essentia</em>
        </>
      }
      subtitle="Track every order, reorder favourites and get early access to new launches."
    >
      <Suspense fallback={<FormSkeleton fields={3} />}>
        <RegisterContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function RegisterContent({ searchParams }: { searchParams: PageProps<"/register">["searchParams"] }) {
  const { next } = await searchParams;
  if (await getSessionUser()) redirect("/account");
  return <RegisterForm next={typeof next === "string" ? next : undefined} />;
}
