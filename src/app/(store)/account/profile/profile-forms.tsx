"use client";

import { useActionState } from "react";
import { Field, FormAlert, SubmitButton } from "@/components/ui/form";
import type { FormState } from "@/lib/validation";
import { changePasswordAction, updateProfileAction } from "../actions";

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action] = useActionState(updateProfileAction, {} as FormState);
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormAlert error={state.error} message={state.message} />
      <Field label="Full name" name="name" defaultValue={name} required error={state.fieldErrors?.name} />
      <Field label="Mobile number" name="phone" type="tel" defaultValue={phone} error={state.fieldErrors?.phone} />
      <SubmitButton className="btn btn-dark">Save details</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, {} as FormState);
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormAlert error={state.error} message={state.message} />
      <Field label="Current password" name="current" type="password" autoComplete="current-password" required error={state.fieldErrors?.current} />
      <Field label="New password" name="password" type="password" autoComplete="new-password" required hint="At least 8 characters" error={state.fieldErrors?.password} />
      <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required error={state.fieldErrors?.confirm} />
      <SubmitButton className="btn btn-dark">Update password</SubmitButton>
    </form>
  );
}
