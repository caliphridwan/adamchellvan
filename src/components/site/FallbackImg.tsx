"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Plain <img> that tries each source in turn (bundled copy first, then Unsplash's CDN).
 * The browser loads the photo directly, so it doesn't depend on the Next.js image optimiser
 * being able to reach the internet from the server. If every source fails, it hides itself
 * and the navy background shows instead of a broken image.
 */
export function FallbackImg({ srcs, alt, className, priority = false }: { srcs: string[]; alt: string; className?: string; priority?: boolean }) {
  const [i, setI] = useState(0);
  if (i >= srcs.length) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={srcs[i]}
      src={srcs[i]}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setI((n) => n + 1)}
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
    />
  );
}
