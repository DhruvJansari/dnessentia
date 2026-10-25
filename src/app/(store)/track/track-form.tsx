"use client";

import { useActionState } from "react";
import { trackOrderAction } from "@/app/(store)/checkout/actions";
import { Field, FormAlert, SubmitButton } from "@/components/ui/form";

export function TrackForm() {
  const [state, action] = useActionState(trackOrderAction, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormAlert error={state.error} />
      <Field label="Order number" name="orderNumber" placeholder="DN10023" required autoCapitalize="characters" />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <SubmitButton>Find my order</SubmitButton>
    </form>
  );
}
