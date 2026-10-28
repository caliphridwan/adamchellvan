"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconHeart } from "@/components/icons";
import { cn } from "@/lib/utils";
import { FAVOURITES_COOKIE, parseFavourites } from "@/lib/favourites";
import { track } from "./analytics";

function readFavs(): string[] {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${FAVOURITES_COOKIE}=`));
  return parseFavourites(match ? decodeURIComponent(match.split("=")[1] ?? "") : "");
}

function writeFavs(ids: string[]) {
  const value = encodeURIComponent(ids.join(","));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${FAVOURITES_COOKIE}=${value}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`;
}

/** Saved properties are kept in a first-party functional cookie — no account required. */
export function FavouriteButton({
  propertyId,
  title,
  variant = "icon",
  refreshOnChange = false,
}: {
  propertyId: string;
  title: string;
  variant?: "icon" | "button";
  refreshOnChange?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setSaved(readFavs().includes(propertyId));
  }, [propertyId]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const current = readFavs();
    const next = current.includes(propertyId) ? current.filter((id) => id !== propertyId) : [propertyId, ...current].slice(0, 50);
    writeFavs(next);
    const nowSaved = next.includes(propertyId);
    setSaved(nowSaved);
    if (nowSaved) track("Property Saved");
    if (refreshOnChange) router.refresh();
  }

  const label = saved ? `Remove “${title}” from saved properties` : `Save “${title}”`;

  if (variant === "button") {
    return (
      <button type="button" onClick={toggle} aria-pressed={saved} className="btn-outline w-full" aria-label={label}>
        <IconHeart filled={saved} className={cn("h-4 w-4", saved && "text-champagne-500")} />
        {saved ? "Saved" : "Save property"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={label}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-navy-900 shadow-sm backdrop-blur transition-colors hover:bg-white",
        saved && "text-champagne-500",
      )}
    >
      <IconHeart filled={saved} className="h-5 w-5" />
    </button>
  );
}
