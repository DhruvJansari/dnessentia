"use client";

import { useActionState, useState, useTransition } from "react";
import { createUserAction, markVerifiedAction, signOutEverywhereAction, type CustomerResult } from "@/app/admin/customers/actions";
import type { FormState } from "@/lib/validation";
import { Spinner, SubmitButton } from "../ui/form";
import { btn, input } from "./ui";

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-stone-700">
        {label} {error && <span className="font-normal text-red-700">{error}</span>}
      </span>
      {children}
    </label>
  );
}

function Message({ state }: { state: FormState }) {
  if (!state.message && !state.error) return null;
  return (
    <p className={`rounded-lg px-3 py-2 text-sm ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`} role="status">
      {state.message ?? state.error}
    </p>
  );
}

export function UserDetailsForm({
  action,
  defaults,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults: { name: string; email: string; phone: string };
}) {
  const [state, formAction] = useActionState(action, {} as FormState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="space-y-3">
      <F label="Name" error={e.name}>
        <input name="name" defaultValue={defaults.name} className={input} />
      </F>
      <F label="Email" error={e.email}>
        <input name="email" type="email" defaultValue={defaults.email} className={input} />
      </F>
      <F label="Mobile" error={e.phone}>
        <input name="phone" type="tel" defaultValue={defaults.phone} className={input} />
      </F>
      <Message state={state} />
      <SubmitButton className={btn.primary}>Save details</SubmitButton>
    </form>
  );
}

export function CreateUserForm({ canAddTeam }: { canAddTeam: boolean }) {
  const [state, action] = useActionState(createUserAction, {} as FormState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
      <F label="Name" error={e.name}>
        <input name="name" className={input} />
      </F>
      <F label="Email" error={e.email}>
        <input name="email" type="email" className={input} />
      </F>
      <F label="Mobile (optional)" error={e.phone}>
        <input name="phone" type="tel" className={input} />
      </F>
      <F label="Role">
        <select name="role" defaultValue="customer" className={input}>
          <option value="customer">Customer</option>
          {canAddTeam && <option value="staff">Staff (orders & products)</option>}
          {canAddTeam && <option value="admin">Admin (everything)</option>}
        </select>
      </F>
      <SubmitButton className={btn.primary}>Create & send invite</SubmitButton>
      <div className="sm:col-span-2 lg:col-span-5">
        <Message state={state} />
        {!state.message && <p className="text-[12px] text-stone-500">They get an email with a link to set their own password. You never need to share one.</p>}
      </div>
    </form>
  );
}

export function SessionActions({ userId, verified }: { userId: number; verified: boolean }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<CustomerResult | null>(null);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => start(async () => setResult(await signOutEverywhereAction(userId)))} className={btn.secondary}>
          {pending && <Spinner />} Sign out of all devices
        </button>
        {!verified && (
          <button type="button" disabled={pending} onClick={() => start(async () => setResult(await markVerifiedAction(userId)))} className={btn.secondary}>
            Mark email as verified
          </button>
        )}
      </div>
      {result && <p className={`text-sm ${result.ok ? "text-emerald-700" : "text-red-700"}`}>{result.message}</p>}
    </div>
  );
}
