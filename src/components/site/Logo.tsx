import Link from "next/link";
import type { SiteSettings } from "@prisma/client";
import { cn } from "@/lib/utils";

/** Initials for the monogram, e.g. "ADAM CHELLVAN" → "AC". */
function monogram(text: string): string {
  const words = text.replace(/[^A-Za-z\s]/g, "").split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? "") + (words[1]?.[0] ?? "") || "·";
}

export function Logo({ settings, tone = "light" }: { settings: SiteSettings; tone?: "light" | "dark" }) {
  const primary = settings.brandPrimary || settings.companyName;
  const secondary = settings.brandPrimary ? settings.brandSecondary : settings.slogan;
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label={`${settings.companyName} — home`}>
      {settings.logoUrl ? (
        // Logos are small and often SVG; a plain img avoids optimiser issues with vector files.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={settings.logoUrl} alt="" className="h-11 w-auto" />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center border font-display text-lg font-semibold tracking-wider",
            tone === "light" ? "border-champagne-400 text-champagne-300" : "border-champagne-500 text-champagne-700",
          )}
        >
          {monogram(primary)}
        </span>
      )}
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.25rem] font-semibold uppercase tracking-[0.14em] sm:text-[1.4rem]",
            tone === "light" ? "text-ivory-50" : "text-navy-900",
          )}
        >
          {primary}
        </span>
        {secondary ? (
          <span
            className={cn(
              "mt-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.3em]",
              tone === "light" ? "text-champagne-300" : "text-champagne-700",
            )}
          >
            {secondary}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
