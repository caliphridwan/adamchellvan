import Link from "next/link";
import type { SiteSettings } from "@prisma/client";
import { IconMail, IconPhone, IconPin, IconWhatsApp } from "@/components/icons";
import { PLACEHOLDER } from "@/lib/constants";
import { telLink, whatsappLink } from "@/lib/utils";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";
import { TrackedLink } from "./analytics";

export function Footer({ settings, services }: { settings: SiteSettings; services: { slug: string; title: string }[] }) {
  const socials = [
    { href: settings.facebookUrl, label: "Facebook" },
    { href: settings.instagramUrl, label: "Instagram" },
    { href: settings.linkedinUrl, label: "LinkedIn" },
    { href: settings.xUrl, label: "X" },
    { href: settings.youtubeUrl, label: "YouTube" },
    { href: settings.tiktokUrl, label: "TikTok" },
  ].filter((s): s is { href: string; label: string } => Boolean(s.href));
  const tel = telLink(settings.phone);
  const wa = whatsappLink(settings.whatsapp, `Hello ${settings.companyName}, I'd like to make an enquiry.`);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 text-ivory-100/80">
      <div className="container grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:py-20">
        <div className="lg:col-span-4">
          <Logo settings={settings} />
          {settings.slogan ? <p className="mt-6 font-display text-xl italic text-champagne-300">{settings.slogan}</p> : null}
          {settings.shortDescription ? (
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ivory-100/70">{settings.shortDescription}</p>
          ) : null}
          {socials.length ? (
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2" aria-label="Social media">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs uppercase tracking-[0.16em] text-champagne-300 hover:text-ivory-50"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-label="Footer — explore" className="lg:col-span-2">
          <h2 className="eyebrow-light mb-5 font-sans">Explore</h2>
          <ul className="space-y-3 text-sm">
            <li><Link href="/properties" className="hover:text-ivory-50">Find a property</Link></li>
            <li><Link href="/properties?type=SALE" className="hover:text-ivory-50">Properties for sale</Link></li>
            <li><Link href="/rent-and-lease" className="hover:text-ivory-50">Rent &amp; lease</Link></li>
            <li><Link href="/land-and-commercial" className="hover:text-ivory-50">Land &amp; commercial</Link></li>
            <li><Link href="/investment-opportunities" className="hover:text-ivory-50">Investment opportunities</Link></li>
            <li><Link href="/international-clients" className="hover:text-ivory-50">International clients</Link></li>
            <li><Link href="/list-your-property" className="hover:text-ivory-50">List your property</Link></li>
          </ul>
        </nav>

        <nav aria-label="Footer — company" className="lg:col-span-2">
          <h2 className="eyebrow-light mb-5 font-sans">Company</h2>
          <ul className="space-y-3 text-sm">
            <li><Link href="/about" className="hover:text-ivory-50">About us</Link></li>
            {services.slice(0, 5).map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="hover:text-ivory-50">{s.title}</Link>
              </li>
            ))}
            <li><Link href="/insights" className="hover:text-ivory-50">Insights</Link></li>
            <li><Link href="/faq" className="hover:text-ivory-50">FAQs</Link></li>
            <li><Link href="/contact" className="hover:text-ivory-50">Contact</Link></li>
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <h2 className="eyebrow-light mb-5 font-sans">Get in touch</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <IconPin className="mt-0.5 h-4 w-4 shrink-0 text-champagne-300" />
              <span className="whitespace-pre-line">{settings.officeAddress || PLACEHOLDER.address}</span>
            </li>
            <li className="flex gap-3">
              <IconPhone className="mt-0.5 h-4 w-4 shrink-0 text-champagne-300" />
              {tel ? <TrackedLink event="Phone Click" track="phone" href={tel} className="hover:text-ivory-50">{settings.phone}</TrackedLink> : <span>{PLACEHOLDER.phone}</span>}
            </li>
            <li className="flex gap-3">
              <IconMail className="mt-0.5 h-4 w-4 shrink-0 text-champagne-300" />
              {settings.email ? (
                <TrackedLink event="Email Click" track="email" href={`mailto:${settings.email}`} className="hover:text-ivory-50">{settings.email}</TrackedLink>
              ) : (
                <span>{PLACEHOLDER.email}</span>
              )}
            </li>
            {wa ? (
              <li className="flex gap-3">
                <IconWhatsApp className="mt-0.5 h-4 w-4 shrink-0 text-champagne-300" />
                <TrackedLink event="WhatsApp Click" track="whatsapp" href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-ivory-50">
                  Chat on WhatsApp
                </TrackedLink>
              </li>
            ) : null}
          </ul>
          <div className="mt-8">
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-4 py-6 text-xs text-ivory-100/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {settings.companyName}. All rights reserved.
            {settings.registrationInfo ? <span className="ml-2">{settings.registrationInfo}</span> : null}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li><Link href="/privacy" className="hover:text-ivory-50">Privacy policy</Link></li>
            <li><Link href="/terms" className="hover:text-ivory-50">Terms of use</Link></li>
            <li><Link href="/cookies" className="hover:text-ivory-50">Cookie preferences</Link></li>
          </ul>
        </div>
        {settings.footerNote ? (
          <p className="container pb-6 text-xs leading-relaxed text-ivory-100/50">{settings.footerNote}</p>
        ) : null}
      </div>
    </footer>
  );
}
