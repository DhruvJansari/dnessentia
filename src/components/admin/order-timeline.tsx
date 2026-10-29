"use client";

import { useState } from "react";
import type { TimelineEntry, TimelineTone } from "@/lib/orders/describe-event";

const dot: Record<TimelineTone, string> = {
  neutral: "bg-stone-800",
  good: "bg-emerald-500",
  info: "bg-sky-500",
  warn: "bg-amber-500",
  bad: "bg-red-500",
  muted: "bg-stone-300",
};

const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });
const dayKey = (iso: string) => new Date(new Date(iso).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);

/** Newest-first order history in plain language, grouped by day. Routine emails and stock moves are behind a toggle. */
export function OrderTimeline({ entries, today }: { entries: TimelineEntry[]; today: string }) {
  const [showRoutine, setShowRoutine] = useState(false);
  const visible = entries.filter((e) => showRoutine || !e.routine);
  const hidden = entries.length - visible.length;
  const yesterday = dayKey(new Date(new Date(`${today}T12:00:00Z`).getTime() - 864e5).toISOString());

  const groups: { key: string; items: TimelineEntry[] }[] = [];
  for (const e of visible) {
    const key = dayKey(e.at);
    const g = groups.at(-1);
    if (g && g.key === key) g.items.push(e);
    else groups.push({ key, items: [e] });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[12px] text-stone-500">Newest first</p>
        {(hidden > 0 || showRoutine) && (
          <button type="button" onClick={() => setShowRoutine((v) => !v)} className="text-[12px] text-stone-600 underline-offset-4 hover:text-stone-900 hover:underline">
            {showRoutine ? "Hide emails & stock updates" : `Show emails & stock updates (${hidden})`}
          </button>
        )}
      </div>
      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.key}>
            <h3 className="mb-3 font-sans text-[12px] font-semibold uppercase tracking-[0.04em] text-stone-500">
              {g.key === today ? "Today" : g.key === yesterday ? "Yesterday" : dayFmt.format(new Date(`${g.key}T12:00:00+05:30`))}
            </h3>
            <ol className="relative space-y-4 border-l border-stone-200 pl-5">
              {g.items.map((e) => (
                <li key={e.id} className="relative">
                  <span className={`absolute -left-[26px] top-1.5 size-2.5 rounded-full ring-4 ring-white ${dot[e.tone]}`} />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className={`text-sm font-medium ${e.tone === "muted" ? "text-stone-600" : "text-stone-900"}`}>{e.title}</p>
                    <time className="text-[12px] tabular-nums text-stone-400" dateTime={e.at}>
                      {timeFmt.format(new Date(e.at))}
                    </time>
                  </div>
                  {e.detail && <p className="mt-0.5 text-[13px] text-stone-600">{e.detail}</p>}
                  <p className="mt-0.5 text-[12px] text-stone-400">
                    {e.who}
                    {e.internal ? " · only staff can see this" : " · customer can see this"}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
