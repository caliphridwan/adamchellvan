"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconHeart, IconPhone } from "@/components/icons";
import { cn, telLink } from "@/lib/utils";

const EXIT_MS = 380;

/**
 * Mobile menu with a staged animation: the panel slides down and fades in, a gold rule draws
 * across, then links rise in one after another. Closing reverses it before unmounting.
 * All motion is CSS transitions, and globals.css disables it for prefers-reduced-motion.
 */
export function MobileNav({ links, phone }: { links: { href: string; label: string }[]; phone: string | null }) {
  const [rendered, setRendered] = useState(false); // panel is in the DOM
  const [visible, setVisible] = useState(false); // panel is in its "open" state (drives the transitions)
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tel = telLink(phone);

  const open = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setRendered(true);
    // Two frames so the browser paints the closed state first, then transitions to open.
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setRendered(false), EXIT_MS);
  }, []);

  useEffect(() => setMounted(true), []);
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);
  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!rendered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [rendered, close]);

  const items = [...links, { href: "/favourites", label: "Saved properties", heart: true }];

  return (
    <div className="xl:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="relative flex h-11 w-11 items-center justify-center rounded text-ivory-50 transition-colors hover:bg-white/5"
        aria-expanded={visible}
        aria-controls="mobile-menu"
        aria-label={visible ? "Close menu" : "Open menu"}
        onClick={() => (visible ? close() : open())}
      >
        {/* Hamburger that morphs into an X */}
        <span aria-hidden="true" className="relative block h-4 w-6">
          <span
            className={cn(
              "absolute left-0 top-0 block h-[1.5px] w-6 bg-current transition-transform duration-300 ease-[cubic-bezier(.2,.7,.2,1)]",
              visible && "translate-y-[7px] rotate-45",
            )}
          />
          <span
            className={cn(
              "absolute left-0 top-[7px] block h-[1.5px] w-6 bg-current transition-[opacity,transform] duration-200",
              visible ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100",
            )}
          />
          <span
            className={cn(
              "absolute left-0 top-[14px] block h-[1.5px] bg-current transition-[transform,width] duration-300 ease-[cubic-bezier(.2,.7,.2,1)]",
              visible ? "w-6 -translate-y-[7px] -rotate-45" : "w-4",
            )}
          />
        </span>
      </button>

      {/* Rendered into <body> so no ancestor (e.g. a backdrop-filter) can trap or clip the fixed panel. */}
      {rendered && mounted
        ? createPortal(
            <div
              id="mobile-menu"
              className={cn(
                "fixed inset-x-0 bottom-0 top-[80px] z-[45] h-[calc(100dvh-80px)] overflow-y-auto overscroll-contain bg-navy-950 px-6 pb-10 pt-6 xl:hidden",
                "transition-[opacity,transform,clip-path] duration-[380ms] ease-[cubic-bezier(.2,.7,.2,1)]",
                visible
                  ? "translate-y-0 opacity-100 [clip-path:inset(0_0_0_0)]"
                  : "-translate-y-3 opacity-0 [clip-path:inset(0_0_100%_0)]",
              )}
            >
              {/* Subtle architectural grid behind the menu */}
              <div aria-hidden="true" className="bg-architectural pointer-events-none absolute inset-0 opacity-60" />

              <div className="relative">
                {/* Gold rule that draws across on open */}
                <div
                  aria-hidden="true"
                  className={cn(
                    "h-px origin-left bg-champagne-400 transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)]",
                    visible ? "scale-x-100 delay-150" : "scale-x-0",
                  )}
                />

                <nav aria-label="Mobile" className="mt-2">
                  <ul>
                    {items.map((l, i) => (
                      <li
                        key={l.href}
                        className={cn(
                          "border-b border-white/10 transition-[opacity,transform] duration-500 ease-[cubic-bezier(.2,.7,.2,1)]",
                          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                        )}
                        style={{ transitionDelay: visible ? `${120 + i * 45}ms` : "0ms" }}
                      >
                        <Link
                          href={l.href}
                          onClick={close}
                          aria-current={pathname === l.href ? "page" : undefined}
                          className="group flex items-center justify-between gap-4 py-4 font-display text-[1.6rem] leading-tight text-ivory-50"
                        >
                          <span className="flex items-center gap-3">
                            {"heart" in l ? <IconHeart className="h-5 w-5 text-champagne-300" /> : null}
                            <span className={cn("transition-colors group-hover:text-champagne-300", pathname === l.href && "text-champagne-300")}>
                              {l.label}
                            </span>
                          </span>
                          <span
                            aria-hidden="true"
                            className="text-champagne-300 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-1 group-hover:opacity-100 group-focus-visible:opacity-100"
                          >
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                <div
                  className={cn(
                    "mt-8 flex flex-col gap-3 transition-[opacity,transform] duration-500 ease-[cubic-bezier(.2,.7,.2,1)]",
                    visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                  )}
                  style={{ transitionDelay: visible ? `${160 + items.length * 45}ms` : "0ms" }}
                >
                  <Link href="/list-your-property" onClick={close} className="btn-gold">
                    List your property
                  </Link>
                  <Link href="/contact?type=CONSULTATION" onClick={close} className="btn-outline-light">
                    Book a consultation
                  </Link>
                  {tel ? (
                    <a href={tel} className="btn-outline-light">
                      <IconPhone className="h-4 w-4" /> {phone}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
