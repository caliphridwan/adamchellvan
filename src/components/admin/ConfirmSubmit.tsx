"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Two-step confirmation for destructive actions. Place inside a <form action={serverAction}>.
 * First click reveals the confirmation; only the second click submits.
 */
export function ConfirmSubmit({
  label,
  confirmLabel = "Yes, I'm sure",
  message = "This cannot be undone.",
  className = "btn-outline btn-sm",
  danger = true,
}: {
  label: string;
  confirmLabel?: string;
  message?: string;
  className?: string;
  danger?: boolean;
}) {
  const [asking, setAsking] = useState(false);
  const { pending } = useFormStatus();

  if (!asking) {
    return (
      <button type="button" className={className} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <span role="alertdialog" aria-label={`Confirm: ${label}`} className="inline-flex flex-wrap items-center gap-2 rounded border border-danger/30 bg-danger/5 px-3 py-1.5">
      <span className="text-xs text-danger">{message}</span>
      <button type="submit" className={cn("btn-sm", danger ? "btn-danger" : "btn-primary")} disabled={pending} autoFocus>
        {pending ? "Working…" : confirmLabel}
      </button>
      <button type="button" className="btn-ghost btn-sm" onClick={() => setAsking(false)} disabled={pending}>
        Cancel
      </button>
    </span>
  );
}

/** Plain submit with pending state, for non-destructive one-click actions. */
export function ActionButton({ children, className = "btn-outline btn-sm" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "Working…" : children}
    </button>
  );
}
