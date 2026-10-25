"use client";

import { useActionState, useState } from "react";
import { saveCouponAction } from "@/app/admin/coupons/actions";
import type { FormState } from "@/lib/validation";
import { SubmitButton } from "../ui/form";
import { btn, input } from "./ui";

type Coupon = {
  id: number;
  code: string;
  description: string;
  type: "percent" | "fixed" | "free_gift";
  value: number;
  minOrder: number;
  maxUses: number | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

function F({ label, error, children, className = "" }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[13px] font-medium text-stone-700">
        {label} {error && <span className="font-normal text-red-700">{error}</span>}
      </span>
      {children}
    </label>
  );
}

export function CouponForm({ coupon }: { coupon?: Coupon }) {
  const [state, action] = useActionState(saveCouponAction, {} as FormState);
  const [type, setType] = useState(coupon?.type ?? "percent");
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {coupon && <input type="hidden" name="id" value={coupon.id} />}
      <F label="Code" error={e.code}>
        <input name="code" defaultValue={coupon?.code} className={`${input} uppercase`} placeholder="WELCOME10" />
      </F>
      <F label="Type">
        <select name="type" value={type} onChange={(ev) => setType(ev.target.value as Coupon["type"])} className={input}>
          <option value="percent">% off</option>
          <option value="fixed">₹ off</option>
          <option value="free_gift">Free gift (no discount)</option>
        </select>
      </F>
      {type !== "free_gift" ? (
        <F label={type === "percent" ? "Percent off" : "Rupees off"} error={e.value}>
          <input name="value" type="number" min={0} defaultValue={coupon?.value ?? 10} className={input} />
        </F>
      ) : (
        <input type="hidden" name="value" value={0} />
      )}
      <F label="Minimum order ₹" error={e.minOrder}>
        <input name="minOrder" type="number" min={0} defaultValue={coupon?.minOrder ?? 0} className={input} />
      </F>
      <F label={type === "free_gift" ? "Gift shown to customer" : "Description (internal)"} className="sm:col-span-2">
        <input name="description" defaultValue={coupon?.description} className={input} placeholder={type === "free_gift" ? "Free 1ml attar sample" : ""} />
      </F>
      <F label="Usage limit" error={e.maxUses}>
        <input name="maxUses" type="number" min={1} defaultValue={coupon?.maxUses ?? ""} placeholder="Unlimited" className={input} />
      </F>
      <div className="grid grid-cols-2 gap-3">
        <F label="Starts">
          <input name="startsAt" type="date" defaultValue={coupon?.startsAt} className={input} />
        </F>
        <F label="Ends">
          <input name="endsAt" type="date" defaultValue={coupon?.endsAt} className={input} />
        </F>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={coupon?.isActive ?? true} className="size-4 accent-stone-900" /> Active
      </label>
      <div className="flex items-center justify-end gap-3 sm:col-span-2">
        {state.message && <p className="text-sm text-emerald-700">{state.message}</p>}
        <SubmitButton className={btn.primary}>{coupon ? "Save coupon" : "Create coupon"}</SubmitButton>
      </div>
    </form>
  );
}
