"use client";

import { useActionState, useState, useTransition } from "react";
import { saveSettingsAction, testEmailAction, testShiprocketAction } from "@/app/admin/settings/actions";
import type { FormState } from "@/lib/validation";
import { Spinner, SubmitButton } from "../ui/form";
import { btn, input } from "./ui";

type FieldDef =
  | { name: string; label: string; type: "number" | "text" | "email"; value: string | number; hint?: string; suffix?: string }
  | { name: string; label: string; type: "checkbox"; value: boolean; hint?: string };

export function SettingsForm({ section, fields }: { section: string; fields: FieldDef[] }) {
  const [state, action] = useActionState(saveSettingsAction, {} as FormState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="_section" value={section} />
      {fields.map((f) =>
        f.type === "checkbox" ? (
          <label key={f.name} className="flex items-start justify-between gap-4 text-sm">
            <span>
              <span className="font-medium">{f.label}</span>
              {f.hint && <span className="block text-[12px] text-stone-500">{f.hint}</span>}
            </span>
            <input type="checkbox" name={f.name} defaultChecked={f.value} className="mt-0.5 size-5 shrink-0 accent-stone-900" />
          </label>
        ) : (
          <label key={f.name} className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-stone-700">
              {f.label}
              {state.fieldErrors?.[f.name] && <span className="ml-2 font-normal text-red-700">{state.fieldErrors[f.name]}</span>}
            </span>
            <div className="relative">
              <input name={f.name} type={f.type} defaultValue={f.value} className={input} />
              {f.suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">{f.suffix}</span>}
            </div>
            {f.hint && <span className="mt-1 block text-[12px] text-stone-500">{f.hint}</span>}
          </label>
        ),
      )}
      <div className="flex items-center justify-end gap-3 pt-1">
        {state.ok && <span className="text-sm text-emerald-700">{state.message}</span>}
        {state.error && <span className="text-sm text-red-700">{state.error}</span>}
        <SubmitButton className={btn.primary}>Save</SubmitButton>
      </div>
    </form>
  );
}

export function TestButton({ kind }: { kind: "email" | "shiprocket" }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setResult(await (kind === "email" ? testEmailAction() : testShiprocketAction())))}
        className={btn.secondary}
      >
        {pending && <Spinner />} {kind === "email" ? "Send test email" : "Test connection"}
      </button>
      {result && <p className={`mt-2 text-[13px] ${result.ok ? "text-emerald-700" : "text-red-700"}`}>{result.message}</p>}
    </div>
  );
}

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <input readOnly value={value} className={`${input} font-mono text-[12px]`} onFocus={(e) => e.target.select()} />
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className={btn.secondary}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
