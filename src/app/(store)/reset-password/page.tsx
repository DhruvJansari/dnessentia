import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormSkeleton } from "@/components/auth/form-skeleton";
import { ResetPasswordForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <AuthShell title="Choose a new password" subtitle="You'll be signed in on this device once it's saved.">
      <Suspense fallback={<FormSkeleton />}>
        <ResetContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function ResetContent({ searchParams }: { searchParams: PageProps<"/reset-password">["searchParams"] }) {
  const { token } = await searchParams;
  if (typeof token !== "string" || token.length < 10) {
    return (
      <p className="text-sm text-ink-soft">
        This link is incomplete.{" "}
        <Link href="/forgot-password" className="underline underline-offset-4">
          Request a new reset link
        </Link>
        .
      </p>
    );
  }
  return <ResetPasswordForm token={token} />;
}
