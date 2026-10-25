"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** A boolean that turns on when triggered and switches itself off after `ms`; used for "Added" feedback. */
export function useFlash(ms = 1600) {
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const trigger = useCallback(() => {
    clearTimeout(timer.current);
    setOn(true);
    timer.current = setTimeout(() => setOn(false), ms);
  }, [ms]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return [on, trigger] as const;
}
