"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/form";
import { resendVerificationAction } from "@/lib/auth/actions";

export function ResendVerification() {
  const [state, action] = useActionState(resendVerificationAction, {});
  if (state.ok || state.error) return <p className="text-sm text-ink-soft">{state.message ?? state.error}</p>;
  return (
    <form action={action}>
      <SubmitButton className="btn btn-outline h-10 px-5">Resend email</SubmitButton>
    </form>
  );
}
