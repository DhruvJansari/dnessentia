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
      className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${optimistic ? "bg-emerald-500" : "bg-stone-300"}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-300 ${optimistic ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}
