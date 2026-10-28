"use client";

import { useState } from "react";
import { IconLink, IconShare } from "@/components/icons";
import { track } from "./analytics";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${title} ${url}`)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: "X", href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { label: "Email", href: `mailto:?subject=${enc(title)}&body=${enc(url)}` },
  ];

  async function nativeShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        track("Property Shared", { method: "native" });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track("Property Shared", { method: "copy" });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <button type="button" onClick={nativeShare} className="btn-ghost btn-sm px-2">
        {copied ? <IconLink className="h-4 w-4" /> : <IconShare className="h-4 w-4" />}
        <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
      </button>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-[0.12em]">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-charcoal-500 hover:text-navy-900" onClick={() => track("Property Shared", { method: l.label })}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
