import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { IconArrowRight, IconCheck, IconPhone, IconWhatsApp } from "@/components/icons";
import { PropertyGrid } from "@/components/site/PropertyCard";
import { HeroSearch } from "@/components/site/HeroSearch";
import { RequirementForm } from "@/components/site/LeadForms";
import { Reveal } from "@/components/site/Reveal";
import { Editable, JsonLd, SectionHeading } from "@/components/site/common";
import { TrackedLink } from "@/components/site/analytics";
import { PhotoCredit, StockBackdrop, StockFill } from "@/components/site/StockPhoto";
import { CATEGORY_IMAGES, PAGE_IMAGES, articleFallback } from "@/lib/placeholder-images";
import {
  getFeaturedProperties,
  getFilterOptions,
  getLatestArticles,
  getPublishedTestimonials,
  getRecentProperties,
} from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, formatDate, isOptimisableImage, paragraphs, telLink, titledLines, whatsappLink } from "@/lib/utils";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// The four homepage category cards link, in order, to these destinations.
const CATEGORY_LINKS = [
  "/properties?group=residential",
  "/properties?group=commercial",
  "/properties?group=land",
  "/investment-opportunities",
];

export default async function HomePage() {
  const settings = await getSettings();
  const [featured, options, testimonials, articles] = await Promise.all([
    getFeaturedProperties(6),
    getFilterOptions(),
    getPublishedTestimonials(3),
    getLatestArticles(3),
  ]);
  const recent = await getRecentProperties(featured.length ? 3 : 6, featured.map((p) => p.id));
  const categoryCards = titledLines(settings.categoryCards).slice(0, 4);
  const approachPoints = titledLines(settings.differentiators);
  const wa = whatsappLink(settings.whatsapp, `Hello ${settings.companyName}, I'd like to discuss my property requirements.`);
  const tel = telLink(settings.phone);
  const hasAnyListing = featured.length > 0 || recent.length > 0;
  const strip = (settings.servicesStrip ?? "").split(/[·|•,]/).map((s) => s.trim()).filter(Boolean);

  const orgJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: settings.companyName,
    url: absoluteUrl("/"),
    ...(settings.slogan ? { slogan: settings.slogan } : {}),
    ...(settings.logoUrl ? { logo: settings.logoUrl } : {}),
    ...(settings.shortDescription ? { description: settings.shortDescription } : {}),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.officeAddress ? { address: settings.officeAddress } : {}),
    areaServed: "Nigeria",
    sameAs: [settings.facebookUrl, settings.instagramUrl, settings.linkedinUrl, settings.xUrl, settings.youtubeUrl, settings.tiktokUrl].filter(Boolean),
  };

  return (
    <>
      <JsonLd data={orgJsonLd} />

      {/* ─── Hero ─── */}
      <section className="relative isolate overflow-hidden bg-navy-950 text-ivory-50">
        {settings.heroImageUrl ? (
          <>
            <Image
              src={settings.heroImageUrl}
              unoptimized={!isOptimisableImage(settings.heroImageUrl)}
              alt={settings.heroImageAlt ?? ""}
              fill
              priority
              sizes="100vw"
              className="-z-20 object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950/90 via-navy-950/65 to-navy-950/25" />
          </>
        ) : (
          // Placeholder photography of Lagos until the business adds its own hero image in Site settings.
          <StockBackdrop image={PAGE_IMAGES.home} priority overlay="side" />
        )}
        <div className="container flex min-h-[80vh] flex-col justify-end pb-14 pt-20 md:pb-20 lg:min-h-[88vh]">
          <div className="max-w-3xl animate-rise">
            <p className="eyebrow-light">
              <Editable value={settings.heroEyebrow || settings.slogan} placeholder="[HERO EYEBROW]" />
            </p>
            <div className="mt-5 h-px w-16 bg-champagne-400" aria-hidden="true" />
            <h1 className="mt-6 text-display-xl text-ivory-50">
              <Editable value={settings.heroHeadline} placeholder="[HERO HEADLINE FROM YOUR COPY]" />
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ivory-100/80">
              <Editable value={settings.heroSubtext} placeholder="[SUPPORTING HERO TEXT FROM YOUR COPY]" />
            </p>
          </div>
          <div className="mt-12">
            {settings.heroSearchHeading ? (
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
                <h2 className="font-display text-2xl text-ivory-50">{settings.heroSearchHeading}</h2>
                {settings.heroSearchText ? <p className="text-sm text-ivory-100/70">{settings.heroSearchText}</p> : null}
              </div>
            ) : null}
            <HeroSearch
              locations={options.locations}
              categories={options.categories.map((c) => ({ name: c.name, slug: c.slug }))}
              currency={settings.currency}
            />
          </div>
        </div>
      </section>

      {/* ─── Services strip ─── */}
      {strip.length ? (
        <div className="border-b border-ivory-200 bg-white">
          <ul className="container flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-5 md:justify-between" aria-label="What we do">
            {strip.map((item, i) => (
              <li key={item} className="flex items-center gap-6 text-xs font-semibold uppercase tracking-[0.28em] text-navy-900">
                {i > 0 ? <span aria-hidden="true" className="hidden h-1 w-1 rotate-45 bg-champagne-400 md:block" /> : null}
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ─── Introduction ─── */}
      <section className="py-20 md:py-28" aria-labelledby="intro-heading">
        <div className="container grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">Real estate solutions</p>
            <h2 id="intro-heading" className="mt-3 text-display-lg">
              <Editable value={settings.introHeading} placeholder="[INTRODUCTION HEADING]" />
            </h2>
            <div className="rule mt-8" />
          </Reveal>
          <Reveal className="lg:col-span-6 lg:col-start-7" delay={120}>
            <div className="space-y-5 text-[1.08rem] leading-[1.85] text-charcoal-700">
              {paragraphs(settings.introBody).length ? (
                paragraphs(settings.introBody).map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p><Editable value={null} placeholder="[COMPANY INTRODUCTION FROM YOUR COPY]" /></p>
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/properties" className="btn-primary">Explore properties</Link>
              <Link href="/about" className="btn-outline">About us</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Property categories ─── */}
      {categoryCards.length ? (
        <section className="bg-navy-950 py-20 text-ivory-50 md:py-28" aria-labelledby="categories-heading">
          <div className="container">
            <SectionHeading eyebrow="Browse" title={<span id="categories-heading">Explore our property categories</span>} tone="light" />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categoryCards.map((c, i) => (
                <li key={c.title}>
                  <Link
                    href={CATEGORY_LINKS[i] ?? "/properties"}
                    className="group relative isolate flex h-full min-h-[380px] flex-col justify-end overflow-hidden rounded-md border border-white/10 p-7 transition-colors hover:border-champagne-400/70"
                  >
                    {CATEGORY_IMAGES[i] ? (
                      <StockFill
                        image={CATEGORY_IMAGES[i]!}
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="-z-20 transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                      />
                    ) : null}
                    <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/10" />
                    <span className="font-display text-sm text-champagne-300">{String(i + 1).padStart(2, "0")}</span>
                    <span className="mt-3 font-display text-2xl text-ivory-50">{c.title}</span>
                    {c.body ? <span className="mt-2 text-sm leading-relaxed text-ivory-100/80">{c.body}</span> : null}
                    <span className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-champagne-300">
                      Explore <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ─── Featured / recent listings ─── */}
      <section className="py-20 md:py-28" aria-labelledby="featured-heading">
        <div className="container">
          <SectionHeading
            eyebrow={featured.length ? "Featured" : "Latest listings"}
            title={<span id="featured-heading">{featured.length ? "Featured properties" : "Recently added"}</span>}
            action={
              hasAnyListing ? (
                <Link href="/properties" className="btn-outline">
                  View all properties <IconArrowRight className="h-4 w-4" />
                </Link>
              ) : null
            }
          />
          {hasAnyListing ? (
            <>
              {featured.length ? <PropertyGrid properties={featured} /> : null}
              {recent.length ? (
                <div className={featured.length ? "mt-20" : ""}>
                  {featured.length ? <h3 className="mb-8 font-display text-3xl">Recently added</h3> : null}
                  <PropertyGrid properties={recent} />
                </div>
              ) : null}
            </>
          ) : (
            <div className="card flex flex-col items-start gap-5 p-10 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-display text-3xl text-navy-900">New listings are on their way</p>
                <p className="mt-2 max-w-xl text-charcoal-500">
                  Tell us what you're looking for and we'll let you know when suitable properties become available.
                </p>
              </div>
              <a href="#requirements" className="btn-primary shrink-0">Share your requirements</a>
            </div>
          )}
        </div>
      </section>

      {/* ─── Our approach ─── */}
      {settings.approachHeading || approachPoints.length ? (
        <section className="border-y border-ivory-200 bg-ivory-50 py-20 md:py-28" aria-labelledby="approach-heading">
          <div className="container grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <p className="eyebrow">Our approach</p>
              <h2 id="approach-heading" className="mt-3 text-display-lg">{settings.approachHeading || "Our approach"}</h2>
              {settings.approachBody ? (
                <p className="mt-6 text-[1.05rem] leading-[1.85] text-charcoal-700">{settings.approachBody}</p>
              ) : null}
              <figure className="mt-10 hidden lg:block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-md">
                  <StockFill image={PAGE_IMAGES.approach} sizes="40vw" />
                  <span aria-hidden="true" className="absolute inset-3 rounded-sm border border-champagne-300/60" />
                </div>
                <figcaption className="mt-2"><PhotoCredit image={PAGE_IMAGES.approach} tone="dark" /></figcaption>
              </figure>
            </Reveal>
            {approachPoints.length ? (
              <ul className="grid gap-px self-start overflow-hidden rounded-md border border-ivory-200 bg-ivory-200 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">
                {approachPoints.map((d, i) => (
                  <li key={i} className="bg-white p-7">
                    <IconCheck className="h-5 w-5 text-champagne-700" />
                    <h3 className="mt-4 text-xl leading-snug">{d.title}</h3>
                    {d.body ? <p className="mt-2 text-sm leading-relaxed text-charcoal-500">{d.body}</p> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ─── International / diaspora ─── */}
      {settings.internationalHeading ? (
        <section className="relative isolate overflow-hidden bg-navy-950 py-24 text-ivory-50 md:py-32" aria-labelledby="intl-heading">
          <StockBackdrop image={PAGE_IMAGES.internationalBand} overlay="strong" />
          <div className="container grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="eyebrow-light">International clients &amp; diaspora</p>
              <h2 id="intl-heading" className="mt-3 text-display-lg text-ivory-50">{settings.internationalHeading}</h2>
              {settings.internationalBody ? (
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ivory-100/75">{settings.internationalBody}</p>
              ) : null}
            </div>
            <div className="rounded-md border border-champagne-400/40 bg-white/[0.04] p-8 lg:col-span-5">
              <p className="font-display text-3xl text-ivory-50">Discuss your property requirements</p>
              <p className="mt-3 text-sm leading-relaxed text-ivory-100/75">
                {settings.internationalCtaText || "Request sourcing assistance or an investor consultation."}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/international-clients#investor-form" className="btn-gold">Request a consultation</Link>
                <Link href="/international-clients" className="btn-outline-light">How it works</Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── Insights ─── */}
      {articles.length ? (
        <section className="py-20 md:py-28" aria-labelledby="insights-heading">
          <div className="container">
            <SectionHeading
              eyebrow="Insights"
              title={<span id="insights-heading">{settings.insightsHeading || "Property insights & guides"}</span>}
              intro={settings.insightsBody || undefined}
              action={
                <Link href="/insights" className="btn-outline">
                  All insights <IconArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            <ul className="grid gap-8 md:grid-cols-3">
              {articles.map((a) => (
                <li key={a.slug} className="group relative">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-ivory-200">
                    {a.coverImageUrl ? (
                      <Image src={a.coverImageUrl} unoptimized={!isOptimisableImage(a.coverImageUrl)} alt={a.coverImageAlt ?? ""} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                    ) : (
                      <StockFill image={articleFallback(a.slug)} sizes="(min-width: 768px) 33vw, 100vw" className="transition-transform duration-700 group-hover:scale-[1.03]" />
                    )}
                  </div>
                  <p className="mt-5 text-xs uppercase tracking-[0.14em] text-charcoal-500">{formatDate(a.publishedAt)}</p>
                  <h3 className="mt-2 text-2xl leading-snug">
                    <Link href={`/insights/${a.slug}`} className="after:absolute after:inset-0">{a.title}</Link>
                  </h3>
                  <p className="mt-2 line-clamp-3 text-[0.95rem] leading-relaxed text-charcoal-500">{a.excerpt}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ─── Testimonials (authorised only) ─── */}
      {testimonials.length ? (
        <section className="border-t border-ivory-200 bg-ivory-50 py-20 md:py-28" aria-labelledby="testimonials-heading">
          <div className="container">
            <SectionHeading eyebrow="Client experiences" title={<span id="testimonials-heading">In our clients' words</span>} align="center" />
            <ul className="grid gap-8 lg:grid-cols-3">
              {testimonials.map((t) => (
                <li key={t.id} className="card flex flex-col p-8">
                  <span aria-hidden="true" className="font-display text-6xl leading-none text-champagne-400">“</span>
                  <blockquote className="mt-2 flex-1 font-display text-xl leading-relaxed text-navy-900">{t.quote}</blockquote>
                  <p className="mt-6 text-sm font-semibold text-charcoal-900">{t.authorName}</p>
                  {t.authorRole ? <p className="text-sm text-charcoal-500">{t.authorRole}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ─── Requirements capture ─── */}
      <section id="requirements" className="scroll-mt-24 border-t border-ivory-200 py-20 md:py-28" aria-labelledby="cta-heading">
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Property sourcing</p>
            <h2 id="cta-heading" className="mt-3 text-display-lg">{settings.ctaHeading || "Let us help you find the right opportunity"}</h2>
            {settings.ctaBody ? <p className="mt-5 text-lg leading-relaxed text-charcoal-700">{settings.ctaBody}</p> : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              {wa ? (
                <TrackedLink event="WhatsApp Click" track="whatsapp" href={wa} target="_blank" rel="noopener noreferrer" className="btn-gold">
                  <IconWhatsApp className="h-4 w-4" /> Chat on WhatsApp
                </TrackedLink>
              ) : null}
              {tel ? (
                <TrackedLink event="Phone Click" track="phone" href={tel} className="btn-outline">
                  <IconPhone className="h-4 w-4" /> {settings.phone}
                </TrackedLink>
              ) : null}
            </div>
          </div>
          <div className="card p-6 md:p-10 lg:col-span-7">
            <RequirementForm idPrefix="home-req" compact />
          </div>
        </div>
      </section>
    </>
  );
}
