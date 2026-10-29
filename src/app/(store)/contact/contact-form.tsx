"use client";

import { useActionState } from "react";
import { Field, FormAlert, SubmitButton, TextAreaField } from "@/components/ui/form";
import type { FormState } from "@/lib/validation";
import { contactAction } from "./actions";

export function ContactForm() {
  const [state, action] = useActionState(contactAction, {} as FormState);
  const e = state.fieldErrors ?? {};
  if (state.ok) return <FormAlert message={state.message} />;
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2">
        <FormAlert error={state.error} />
      </div>
      <Field label="Name" name="name" autoComplete="name" required error={e.name} />
      <Field label="Email" name="email" type="email" autoComplete="email" required error={e.email} />
      <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" />
      <Field label="Order number (optional)" name="orderNumber" placeholder="DN10023" />
      <Field label="Subject" name="subject" required error={e.subject} className="sm:col-span-2" />
      <TextAreaField label="Message" name="message" rows={6} error={e.message} className="sm:col-span-2" />
      {/* Honeypot for bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="sm:col-span-2">
        <SubmitButton className="btn btn-dark">Send message</SubmitButton>
      </div>
    </form>
  );
}
