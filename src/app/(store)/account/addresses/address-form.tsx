"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, FormAlert, SelectField, SubmitButton } from "@/components/ui/form";
import { indianStates, type FormState } from "@/lib/validation";
import { saveAddressAction } from "../actions";

type Address = {
  id: number;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export function AddressForm({ address }: { address?: Address }) {
  const [state, action] = useActionState(saveAddressAction, {} as FormState);
  const formRef = useRef<HTMLFormElement>(null);
  const e = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok && !address) formRef.current?.reset();
  }, [state, address]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      {address && <input type="hidden" name="id" value={address.id} />}
      <div className="sm:col-span-2">
        <FormAlert error={state.error} message={state.message} />
      </div>
      <Field label="Full name" name="name" defaultValue={address?.name} required error={e.name} />
      <Field label="Phone" name="phone" type="tel" defaultValue={address?.phone} required error={e.phone} />
      <Field label="Address" name="line1" defaultValue={address?.line1} required error={e.line1} className="sm:col-span-2" />
      <Field label="Apartment, landmark (optional)" name="line2" defaultValue={address?.line2 ?? ""} className="sm:col-span-2" />
      <Field label="City" name="city" defaultValue={address?.city} required error={e.city} />
      <SelectField label="State" name="state" options={indianStates} defaultValue={address?.state ?? ""} required error={e.state} />
      <Field label="PIN code" name="pincode" inputMode="numeric" maxLength={6} defaultValue={address?.pincode} required error={e.pincode} />
      <label className="flex items-center gap-3 self-end pb-3 text-sm">
        <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault} className="size-4 accent-[var(--color-ink)]" />
        Use as default
      </label>
      <div className="sm:col-span-2">
        <SubmitButton className="btn btn-dark">{address ? "Save changes" : "Add address"}</SubmitButton>
      </div>
    </form>
  );
}
