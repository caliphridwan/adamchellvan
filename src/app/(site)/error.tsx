"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[site] render error", error.digest ?? error.message);
  }, [error]);
  return (
    <section className="container py-24">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 text-display-lg">We couldn't load this page</h1>
      <p className="mt-4 max-w-xl text-charcoal-500">Please try again in a moment. If the problem continues, contact us directly.</p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="btn-primary">Try again</button>
        <Link href="/" className="btn-outline">Back to home</Link>
      </div>
    </section>
  );
}
