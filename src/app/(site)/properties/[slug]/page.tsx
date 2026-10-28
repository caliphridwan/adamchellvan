import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  IconArea,
  IconBath,
  IconBed,
  IconCar,
  IconCheck,
  IconDocument,
  IconPhone,
  IconPin,
  IconPlay,
  IconWhatsApp,
} from "@/components/icons";
import { PropertyEnquiryForm } from "@/components/site/EnquiryForm";
import { FavouriteButton } from "@/components/site/FavouriteButton";
import { Gallery } from "@/components/site/Gallery";
import { PropertyGrid, StatusBadge } from "@/components/site/PropertyCard";
import { ShareButtons } from "@/components/site/ShareButtons";
import { TrackedLink } from "@/components/site/analytics";
import { Breadcrumbs, JsonLd } from "@/components/site/common";
import { FURNISHING_LABELS, STATUS_LABELS, TRANSACTION_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { getPropertyBySlug, getSimilarProperties } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, formatArea, formatDate, formatMoney, formatPrice, indicativePrices, paragraphs, parseFxRates, telLink, toNumber, truncate, whatsappLink } from "@/lib/utils";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPropertyBySlug(params.slug);
  if (!p) return { title: "Property not found", robots: { index: false } };
  const image = p.media.find((m) => m.kind === "IMAGE");
  const description = p.seoDescription || p.summary || truncate(p.description.replace(/\s+/g, " "), 160);
  const title = p.seoTitle || `${p.title}, ${p.location.name}`;
  return {
    title,
    description,
    alternates: { canonical: `/properties/${p.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(`/properties/${p.slug}`),
      ...(image ? { images: [{ url: image.url, alt: image.alt ?? p.title }] } : {}),
    },
  };
}

export default async function PropertyPage({ params }: Props) {
  const property = await getPropertyBySlug(params.slug);
  if (!property) notFound();

  const [settings, similar] = await Promise.all([
    getSettings(),
    getSimilarProperties(property),
    // Anonymous, aggregate view counter (no personal data).
    db.property.update({ where: { id: property.id }, data: { viewCount: { increment: 1 } }, select: { id: true } }).catch(() => null),
  ]);

  const images = property.media.filter((m) => m.kind === "IMAGE");
  const floorPlans = property.media.filter((m) => m.kind === "FLOOR_PLAN");
  const brochures = property.media.filter((m) => m.kind === "BROCHURE");
  const price = formatPrice(property);
  const isLand = property.category.group === "LAND";
  const isClosed = property.status === "SOLD" || property.status === "RENTED";
  const url = absoluteUrl(`/properties/${property.slug}`);
  const wa = whatsappLink(settings.whatsapp, `Hello, I'm interested in “${property.title}” (Ref ${property.reference}): ${url}`);
  const tel = telLink(settings.phone);
  const floorArea = formatArea(property.floorArea, property.floorAreaUnit);
  const plotSize = formatArea(property.plotSize, property.plotSizeUnit);

  const facts = [
    !isLand && property.bedrooms != null ? { icon: IconBed, label: "Bedrooms", value: String(property.bedrooms) } : null,
    !isLand && property.bathrooms != null ? { icon: IconBath, label: "Bathrooms", value: String(property.bathrooms) } : null,
    floorArea ? { icon: IconArea, label: "Floor area", value: floorArea } : null,
    plotSize ? { icon: IconArea, label: "Plot size", value: plotSize } : null,
    property.parkingSpaces != null ? { icon: IconCar, label: "Parking", value: String(property.parkingSpaces) } : null,
  ].filter((f): f is NonNullable<typeof f> => f !== null);

  const specs: [string, string][] = (
    [
      ["Reference", property.reference],
      ["Property type", property.category.name],
      ["Transaction", TRANSACTION_LABELS[property.transactionType]],
      ["Status", STATUS_LABELS[property.status]],
      ["Location", [property.location.name, property.location.city, property.location.state].filter(Boolean).join(", ")],
      property.estate ? ["Estate / development", property.estate] : null,
      property.furnishing ? ["Furnishing", FURNISHING_LABELS[property.furnishing]] : null,
      property.bedrooms != null && !isLand ? ["Bedrooms", String(property.bedrooms)] : null,
      property.bathrooms != null && !isLand ? ["Bathrooms", String(property.bathrooms)] : null,
      property.toilets != null ? ["Toilets", String(property.toilets)] : null,
      property.parkingSpaces != null ? ["Parking spaces", String(property.parkingSpaces)] : null,
      floorArea ? ["Floor area", floorArea] : null,
      plotSize ? ["Plot size", plotSize] : null,
      property.yearBuilt ? ["Year built", String(property.yearBuilt)] : null,
      property.titleDocument ? ["Title document", property.titleDocument] : null,
      property.publishedAt ? ["Listed", formatDate(property.publishedAt)] : null,
    ] as ([string, string] | null)[]
  ).filter((s): s is [string, string] => s !== null);

  const amount = toNumber(property.price);
  // Indicative conversions from staff-maintained rates — clearly labelled as estimates.
  const fx = !property.priceOnRequest ? indicativePrices(amount, property.currency, parseFxRates(settings.fxRates, settings.currency)).slice(0, 3) : [];
  const listingJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    url,
    description: property.summary || truncate(property.description.replace(/\s+/g, " "), 300),
    ...(property.publishedAt ? { datePosted: property.publishedAt.toISOString() } : {}),
    ...(images.length ? { image: images.slice(0, 6).map((i) => i.url) } : {}),
    ...(amount !== null && !property.priceOnRequest && !isClosed
      ? {
          offers: {
            "@type": "Offer",
            price: amount,
            priceCurrency: property.currency,
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
    contentLocation: {
      "@type": "Place",
      name: property.location.name,
      address: {
        "@type": "PostalAddress",
        ...(property.location.city ? { addressLocality: property.location.city } : {}),
        ...(property.location.state ? { addressRegion: property.location.state } : {}),
        ...(property.location.country ? { addressCountry: property.location.country } : {}),
      },
    },
  };

  return (
    <>
      <JsonLd data={listingJsonLd} />
      <div className="container pb-8 pt-8 md:pt-10">
        <Breadcrumbs
          items={[
            { label: "Properties", href: "/properties" },
            { label: property.location.name, href: `/properties?location=${property.location.slug}` },
            { label: property.title },
          ]}
        />
      </div>

      <section className="container" aria-label="Photos">
        <Gallery images={images} title={property.title} />
      </section>

      <div className="container grid gap-12 py-12 lg:grid-cols-[1fr_400px] lg:gap-16 lg:py-16">
        <article>
          <header className="border-b border-ivory-200 pb-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge bg-navy-900 text-ivory-50">{TRANSACTION_LABELS[property.transactionType]}</span>
              <StatusBadge status={property.status} className="border border-ivory-300" />
              <span className="badge bg-ivory-200 text-charcoal-700">{property.category.name}</span>
              {property.isInvestment ? <span className="badge bg-champagne-300 text-navy-950">Investment opportunity</span> : null}
            </div>
            <h1 className="mt-5 text-display-lg">{property.title}</h1>
            <p className="mt-3 flex items-center gap-2 text-charcoal-500">
              <IconPin className="h-4 w-4 shrink-0" />
              {property.estate ? `${property.estate}, ` : ""}
              {property.displayAddress ? `${property.displayAddress}, ` : ""}
              <Link href={`/areas/${property.location.slug}`} className="underline-offset-4 hover:underline">{property.location.name}</Link>
              {property.location.state ? `, ${property.location.state}` : ""}
            </p>
            <p className="mt-6 font-display text-4xl font-semibold text-navy-900">{price}</p>
            {fx.length ? (
              <p className="mt-2 text-sm text-charcoal-500">
                Approx. {fx.map((x) => formatMoney(x.amount, x.currency)).join(" · ")}
                <span className="block text-xs">
                  Indicative conversion{settings.fxRatesDate ? ` (rates as of ${settings.fxRatesDate})` : ""} — an estimate, not a transaction quote. Price is set in {property.currency}.
                </span>
              </p>
            ) : null}
            <div className="mt-6">
              <ShareButtons url={url} title={property.title} />
            </div>
          </header>

          {facts.length ? (
            <ul className="grid grid-cols-2 gap-px overflow-hidden border-b border-ivory-200 bg-ivory-200 sm:grid-cols-3 lg:grid-cols-5">
              {facts.map((f) => (
                <li key={f.label} className="bg-ivory-50 px-2 py-6">
                  <f.icon className="h-5 w-5 text-champagne-700" />
                  <p className="mt-3 font-display text-2xl text-navy-900">{f.value}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-charcoal-500">{f.label}</p>
                </li>
              ))}
            </ul>
          ) : null}

          <section className="py-10" aria-labelledby="desc-heading">
            <h2 id="desc-heading" className="text-display-md">About this property</h2>
            {property.summary ? <p className="mt-5 text-lg leading-relaxed text-navy-900">{property.summary}</p> : null}
            <div className="prose-estate mt-5">
              {paragraphs(property.description).map((p, i) => (
                <p key={i} className="whitespace-pre-line">{p}</p>
              ))}
            </div>
          </section>

          {property.amenities.length ? (
            <section className="border-t border-ivory-200 py-10" aria-labelledby="amenities-heading">
              <h2 id="amenities-heading" className="text-display-md">Features &amp; amenities</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {property.amenities.map((a) => (
                  <li key={a.slug} className="flex items-center gap-3 text-charcoal-700">
                    <IconCheck className="h-4 w-4 shrink-0 text-champagne-700" />
                    {a.name}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="border-t border-ivory-200 py-10" aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="text-display-md">Specifications</h2>
            <dl className="mt-6 grid gap-x-10 sm:grid-cols-2">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-ivory-200 py-3 text-sm">
                  <dt className="text-charcoal-500">{k}</dt>
                  <dd className="text-right font-medium text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {floorPlans.length || brochures.length || property.videoUrl || property.virtualTourUrl ? (
            <section className="border-t border-ivory-200 py-10" aria-labelledby="media-heading">
              <h2 id="media-heading" className="text-display-md">Plans, tours &amp; documents</h2>
              {floorPlans.length ? (
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {floorPlans.map((fp, i) => (
                    <li key={fp.id} className="relative aspect-[4/3] overflow-hidden rounded-md border border-ivory-200 bg-white">
                      <a href={fp.url} target="_blank" rel="noopener noreferrer" aria-label={`Open floor plan ${i + 1} in a new tab`}>
                        <Image src={fp.url} alt={fp.alt || `Floor plan ${i + 1}`} fill sizes="(min-width: 640px) 40vw, 100vw" className="object-contain p-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                {property.videoUrl ? (
                  <a href={property.videoUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">
                    <IconPlay className="h-4 w-4" /> Watch video
                  </a>
                ) : null}
                {property.virtualTourUrl ? (
                  <a href={property.virtualTourUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">
                    <IconPlay className="h-4 w-4" /> Virtual tour
                  </a>
                ) : null}
                {brochures.map((b, i) => (
                  <a key={b.id} href={b.url} target="_blank" rel="noopener noreferrer" className="btn-outline">
                    <IconDocument className="h-4 w-4" /> {b.alt || (brochures.length > 1 ? `Brochure ${i + 1}` : "Download brochure")} (PDF)
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <p className="border-t border-ivory-200 py-8 text-sm leading-relaxed text-charcoal-500">
            {settings.listingDisclaimer ||
              "Property details, prices and availability are provided for information only and must be confirmed before any transaction."}
          </p>

          {property.showMap && property.mapQuery ? (
            <section className="border-t border-ivory-200 py-10" aria-labelledby="map-heading">
              <h2 id="map-heading" className="text-display-md">Location</h2>
              <p className="mt-2 text-sm text-charcoal-500">The map shows the general area. The exact address is shared when a viewing is arranged.</p>
              <div className="mt-6 aspect-[16/9] overflow-hidden rounded-md border border-ivory-200 bg-ivory-200">
                <iframe
                  title={`Map of the area around ${property.title}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(property.mapQuery)}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0"
                />
              </div>
            </section>
          ) : null}
        </article>

        <aside aria-label="Enquire about this property">
          <div className="space-y-4 lg:sticky lg:top-[100px]">
            <div className="card p-6 md:p-8">
              <p className="eyebrow">Ref {property.reference}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-navy-900">{price}</p>
              {isClosed ? (
                <p className="mt-4 rounded bg-ivory-100 px-4 py-3 text-sm text-charcoal-700">
                  This property has been {property.status === "SOLD" ? "sold" : "let"} and is no longer available. Contact us about similar opportunities.
                </p>
              ) : null}
              <div className="mt-6 grid gap-3">
                {wa ? (
                  <TrackedLink event="WhatsApp Click" track="whatsapp" propertyId={property.id} href={wa} target="_blank" rel="noopener noreferrer" className="btn-gold">
                    <IconWhatsApp className="h-4 w-4" /> Enquire on WhatsApp
                  </TrackedLink>
                ) : null}
                {tel ? (
                  <TrackedLink event="Phone Click" track="phone" propertyId={property.id} href={tel} className="btn-outline">
                    <IconPhone className="h-4 w-4" /> {settings.phone}
                  </TrackedLink>
                ) : null}
                <FavouriteButton propertyId={property.id} title={property.title} variant="button" />
              </div>
              <div className="mt-8 border-t border-ivory-200 pt-6">
                <PropertyEnquiryForm propertyId={property.id} propertyTitle={property.title} source={`/properties/${property.slug}`} />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {similar.length ? (
        <section className="border-t border-ivory-200 bg-white py-16 md:py-20" aria-labelledby="similar-heading">
          <div className="container">
            <div className="mb-10 flex items-end justify-between gap-6">
              <h2 id="similar-heading" className="text-display-md">Similar properties</h2>
              <Link href={`/properties?category=${property.category.slug}`} className="text-sm font-semibold uppercase tracking-[0.14em] text-navy-900 hover:text-champagne-700">
                View more
              </Link>
            </div>
            <PropertyGrid properties={similar} />
          </div>
        </section>
      ) : null}
    </>
  );
}
