"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconArrowLeft, IconArrowRight, IconClose } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ImagePlaceholder } from "./ImagePlaceholder";

type Img = { id: string; url: string; alt: string | null };

/** Property gallery: mosaic preview + accessible full-screen viewer (keyboard, focus trap, swipe). */
export function Gallery({ images, title }: { images: Img[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const touchX = useRef<number | null>(null);

  const count = images.length;
  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  const openAt = (i: number, trigger: HTMLElement) => {
    lastTrigger.current = trigger;
    setIndex(i);
    setOpen(true);
  };

  const close = useCallback(() => {
    setOpen(false);
    lastTrigger.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>("button");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, go]);

  if (count === 0) {
    return (
      <div className="relative aspect-[16/9] overflow-hidden rounded-md">
        <ImagePlaceholder label="Photography coming soon" />
      </div>
    );
  }

  const altFor = (img: Img, i: number) => img.alt || `${title} — photo ${i + 1} of ${count}`;
  const preview = images.slice(0, 5);

  return (
    <>
      <div className={cn("grid gap-2 overflow-hidden rounded-md", count >= 3 ? "md:grid-cols-4 md:grid-rows-2" : "")}>
        {preview.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={(e) => openAt(i, e.currentTarget)}
            className={cn(
              "group relative overflow-hidden bg-ivory-200",
              i === 0 ? "aspect-[16/10] md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[480px]" : "hidden aspect-[4/3] md:block",
              count < 3 && i > 0 && "md:hidden",
            )}
            aria-label={`Open photo ${i + 1} of ${count}`}
          >
            <Image
              src={img.url}
              alt={altFor(img, i)}
              fill
              priority={i === 0}
              sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "25vw"}
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {i === preview.length - 1 && count > preview.length ? (
              <span className="absolute inset-0 flex items-center justify-center bg-navy-950/55 text-sm font-semibold uppercase tracking-[0.16em] text-ivory-50">
                +{count - preview.length} more
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={(e) => openAt(0, e.currentTarget)}
        className="btn-outline btn-sm mt-3 md:hidden"
      >
        View all {count} photos
      </button>

      {open ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photo gallery`}
          className="fixed inset-0 z-[60] flex flex-col bg-navy-950/[0.97] text-ivory-50"
          onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 md:px-8">
            <p className="text-sm text-ivory-100/80" aria-live="polite">
              {index + 1} / {count}
            </p>
            <button ref={closeRef} type="button" onClick={close} className="btn-ghost text-ivory-50 hover:bg-white/10" aria-label="Close gallery">
              <IconClose className="h-6 w-6" />
            </button>
          </div>
          <div className="relative flex-1">
            <Image
              key={images[index]!.id}
              src={images[index]!.url}
              alt={altFor(images[index]!, index)}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          {count > 1 ? (
            <div className="flex items-center justify-center gap-4 py-4">
              <button type="button" onClick={() => go(-1)} className="btn-outline-light h-12 w-12 rounded-full p-0" aria-label="Previous photo">
                <IconArrowLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => go(1)} className="btn-outline-light h-12 w-12 rounded-full p-0" aria-label="Next photo">
                <IconArrowRight className="h-5 w-5" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
