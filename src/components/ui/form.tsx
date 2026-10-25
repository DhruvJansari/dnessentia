"use client";

import { useFormStatus } from "react-dom";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const inputBase =
  "block w-full border border-line bg-white px-4 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-ink focus:shadow-[0_0_0_3px_rgba(166,128,61,0.15)] aria-[invalid=true]:border-red-700";

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
};

export function Field({ label, name, error, hint, className = "", ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label htmlFor={props.id ?? name} className="mb-1.5 block text-[13px] font-medium text-ink-soft">
        {label}
        {props.required && <span className="text-gold"> *</span>}
      </label>
      <input
        id={props.id ?? name}
        name={name}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`${inputBase} h-12`}
        {...props}
      />
      {error ? (
        <p id={`${name}-error`} className="mt-1.5 text-[13px] text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  name,
  error,
  options,
  className = "",
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-[13px] font-medium text-ink-soft">
        {label}
        {props.required && <span className="text-gold"> *</span>}
      </label>
      <select id={name} name={name} aria-invalid={Boolean(error) || undefined} className={`${inputBase} h-12 pr-8`} {...props}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-[13px] text-red-700">{error}</p>}
    </div>
  );
}

export function TextAreaField({ label, name, error, className = "", ...props }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      <textarea id={name} name={name} className={`${inputBase} min-h-24 py-3`} {...props} />
      {error && <p className="mt-1.5 text-[13px] text-red-700">{error}</p>}
    </div>
  );
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function SubmitButton({ children, className = "btn btn-dark w-full" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function FormAlert({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-gold/30 bg-gold/10 text-ink"}`}
    >
      {error ?? message}
    </p>
  );
}
