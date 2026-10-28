import Link from "next/link";
import type { SiteSettings } from "@prisma/client";
import { IconHeart, IconPhone } from "@/components/icons";
import { telLink } from "@/lib/utils";
import { TrackedLink } from "./analytics";
import { MobileNav } from "./MobileNav";
import { Logo } from "./Logo";

// Navigation follows the client brief: buyers, renters, owners and investors.
export const NAV_LINKS = [
  { href: "/properties", label: "Find a Property" },
  { href: "/rent-and-lease", label: "Rent & Lease" },
  { href: "/investment-opportunities", label: "Investment" },
  { href: "/international-clients", label: "International Clients" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header({ settings }: { settings: SiteSettings }) {
  const tel = telLink(settings.phone);
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-navy-950/95 text-ivory-50 backdrop-blur supports-[backdrop-filter]:bg-navy-950/85">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-ivory-50 focus:px-4 focus:py-2 focus:text-navy-900"
      >
        Skip to content
      </a>
      <div className="container flex h-[80px] items-center justify-between gap-6">
        <Logo settings={settings} />

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-6 2xl:gap-8">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="whitespace-nowrap text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-ivory-100/85 transition-colors hover:text-champagne-300"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-1 xl:flex">
          {tel ? (
            <TrackedLink event="Phone Click" track="phone" href={tel} className="btn-ghost px-2.5 text-ivory-100 hover:bg-white/5" aria-label={`Call ${settings.phone}`}>
              <IconPhone className="h-4 w-4" />
            </TrackedLink>
          ) : null}
          <Link href="/favourites" className="btn-ghost px-2.5 text-ivory-100 hover:bg-white/5" aria-label="Saved properties">
            <IconHeart className="h-5 w-5" />
          </Link>
          <Link href="/list-your-property" className="btn-gold btn-sm ml-2 whitespace-nowrap">
            List your property
          </Link>
        </div>

        <MobileNav links={NAV_LINKS} phone={settings.phone} />
      </div>
    </header>
  );
}
