"use client";

import { useState, useTransition } from "react";
import {
  resendVerifyAction,
  sendResetLinkAction,
  setCustomerActiveAction,
  setRoleAction,
  type CustomerResult,
} from "@/app/admin/customers/actions";
import { Spinner } from "../ui/form";
import { btn, input } from "./ui";

export function CustomerActions({
  userId,
  isActive,
  role,
  verified,
  canChangeRole,
}: {
  userId: number;
  isActive: boolean;
  role: "customer" | "staff" | "admin";
  verified: boolean;
  canChangeRole: boolean;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<CustomerResult | null>(null);
  const run = (fn: () => Promise<CustomerResult>) => start(async () => setResult(await fn()));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => run(() => sendResetLinkAction(userId))} className={btn.secondary}>
          Send password reset
        </button>
        {!verified && (
          <button type="button" disabled={pending} onClick={() => run(() => resendVerifyAction(userId))} className={btn.secondary}>
            Resend verification
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setCustomerActiveAction(userId, !isActive))}
          className={isActive ? btn.danger : btn.secondary}
        >
          {isActive ? "Disable account" : "Enable account"}
        </button>
        {pending && <Spinner />}
      </div>
      {canChangeRole && (
        <label className="flex items-center gap-2 text-sm">
          Role
          <select
            defaultValue={role}
            disabled={pending}
            onChange={(e) => {
              const next = e.target.value as typeof role;
              if (next !== "customer" && !confirm(`Give this person ${next} access to the admin?`)) {
                e.target.value = role;
                return;
              }
              run(() => setRoleAction(userId, next));
            }}
            className={`${input} w-40`}
          >
            <option value="customer">Customer</option>
            <option value="staff">Staff (orders & products)</option>
            <option value="admin">Admin (everything)</option>
          </select>
        </label>
      )}
      {result && (
        <p role="status" className={`rounded-lg px-3 py-2 text-sm ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
