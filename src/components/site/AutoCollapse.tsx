"use client";

import { useEffect } from "react";

/** Collapses a <details> element on small screens after hydration (it is server-rendered open for desktop). */
export function AutoCollapse({ targetId, breakpoint = 1024 }: { targetId: string; breakpoint?: number }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (el instanceof HTMLDetailsElement && window.innerWidth < breakpoint) el.open = false;
  }, [targetId, breakpoint]);
  return null;
}
