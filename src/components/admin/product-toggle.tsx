"use client";

import { useOptimistic, useTransition } from "react";
import { setProductActiveAction } from "@/app/admin/products/actions";

/** Publish / hide switch with optimistic UI. */
export function ProductActiveToggle({ id, active }: { id: number; active: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(active);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={optimistic ? "Visible on store" : "Hidden from store"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          await setProductActiveAction(id, !optimistic);
        })
      }
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0 transition-colors duration-300 disabled:opacity-60 ${optimistic ? "bg-emerald-500" : "bg-stone-300"}`}
    >
      <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-300 ${optimistic ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}
