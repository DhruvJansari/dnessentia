import Link from "next/link";
import type { ReactNode } from "react";

/* Small, consistent building blocks for the admin. Server-safe (no hooks). */

export function PageTitle({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-4xl leading-none sm:text-[2.75rem]">{title}</h1>
        {description && <p className="mt-2 text-sm text-stone-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = "", padded = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={`rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,23,18,0.04)] ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          {typeof title === "string" ? <h2 className="font-sans text-[15px] font-semibold tracking-normal">{title}</h2> : title}
          {actions}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, tone = "default" }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "default" | "warn" | "good" }) {
  const ring = tone === "warn" ? "ring-amber-200 bg-amber-50/50" : tone === "good" ? "ring-emerald-200 bg-emerald-50/40" : "ring-stone-200/80 bg-white";
  return (
    <div className={`rounded-2xl p-5 ring-1 ${ring}`}>
      <p className="text-[13px] text-stone-500">{label}</p>
      <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight">{value}</p>
      {hint && <p className="mt-2 text-[12px] text-stone-500">{hint}</p>}
    </div>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-stone-100 text-[12px] font-medium uppercase tracking-[0.04em] text-stone-500">
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-5 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-5 py-3.5 align-middle ${className}`}>{children}</td>;
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="font-medium">{title}</p>
      {text && <p className="mt-1 text-sm text-stone-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const btn = {
  primary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-50",
  secondary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium transition-colors hover:border-stone-400 disabled:opacity-50",
  danger:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50",
  ghost: "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900",
};

export const input =
  "h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-stone-500 focus:shadow-[0_0_0_3px_rgba(166,128,61,0.15)]";

export function Tabs({ items, active }: { items: { href: string; label: string; count?: number; key: string }[]; active: string }) {
  return (
    <nav className="no-scrollbar -mx-1 mb-4 flex gap-1 overflow-x-auto px-1">
      {items.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
            active === t.key ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-200/60"
          }`}
        >
          {t.label}
          {t.count != null && (
            <span className={`rounded-full px-1.5 text-[11px] ${active === t.key ? "bg-white/20" : "bg-stone-200"}`}>{t.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function Pagination({ page, pages, makeHref }: { page: number; pages: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3 text-sm">
      <span className="text-stone-500">
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={makeHref(page - 1)} className={btn.secondary}>
            Previous
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={makeHref(page + 1)} className={btn.secondary}>
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-stone-200/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-200/50" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl bg-stone-200/40" />
      ))}
    </div>
  );
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const dt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
const d = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
export const fmtDateTime = (date: Date | null | undefined) => (date ? dt.format(date) : "-");
export const fmtDate = (date: Date | null | undefined) => (date ? d.format(date) : "-");

export const PAGE = 25;
