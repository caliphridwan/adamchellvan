"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconClose, IconHeart, IconMenu, IconPhone } from "@/components/icons";
import { telLink } from "@/lib/utils";

export function MobileNav({ links, phone }: { links: { href: string; label: string }[]; phone: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tel = telLink(phone);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="btn-ghost text-ivory-50 hover:bg-white/5"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
      </button>
      {open ? (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-[80px] z-40 overflow-y-auto bg-navy-950 px-6 pb-10 pt-6"
        >
          <nav aria-label="Mobile">
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="block py-4 font-display text-2xl text-ivory-50">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/favourites" className="flex items-center gap-3 py-4 font-display text-2xl text-ivory-50">
                  <IconHeart className="h-5 w-5 text-champagne-300" /> Saved properties
                </Link>
              </li>
            </ul>
          </nav>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/list-your-property" className="btn-gold">
              List your property
            </Link>
            <Link href="/contact?type=CONSULTATION" className="btn-outline-light">
              Book a consultation
            </Link>
            {tel ? (
              <a href={tel} className="btn-outline-light">
                <IconPhone className="h-4 w-4" /> {phone}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
