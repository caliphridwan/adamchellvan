import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { IconArrowRight } from "@/components/icons";
import { getLandingProperties } from "@/lib/queries";
import { PropertyGrid } from "./PropertyCard";
import { PageHero } from "./common";
import type { StockImage } from "@/lib/placeholder-images";

/** Shared layout for audience landing pages: intro, quick filters, live listings, then page-specific content. */
export async function ListingLanding({
  eyebrow,
  title,
  intro,
  breadcrumbs,
  where,
  searchHref,
  quickLinks = [],
  listingsHeading,
  emptyText,
  children,
  image,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  breadcrumbs: { label: string; href?: string }[];
  where: Prisma.PropertyWhereInput;
  searchHref: string;
  quickLinks?: { href: string; label: string }[];
  listingsHeading: string;
  emptyText: string;
  children?: React.ReactNode;
  image?: StockImage;
}) {
  const { total, properties } = await getLandingProperties(where, 9);
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} intro={intro} breadcrumbs={breadcrumbs} image={image} />
      {quickLinks.length ? (
        <nav aria-label="Quick filters" className="border-b border-ivory-200 bg-ivory-50">
          <ul className="container flex flex-wrap gap-2 py-5">
            {quickLinks.map((q) => (
              <li key={q.href}>
                <Link href={q.href} className="btn-outline btn-sm">{q.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <section className="container py-14 md:py-20" aria-labelledby="landing-listings">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 id="landing-listings" className="text-display-md">{listingsHeading}</h2>
          {total > 0 ? (
            <Link href={searchHref} className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-navy-900 hover:text-champagne-700">
              View all {total} <IconArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
        {properties.length ? (
          <PropertyGrid properties={properties} priorityCount={0} />
        ) : (
          <div className="card px-8 py-12 text-center">
            <p className="font-display text-2xl text-navy-900">{emptyText}</p>
            <p className="mx-auto mt-2 max-w-md text-charcoal-500">Share your requirements below and we'll let you know when suitable options become available.</p>
          </div>
        )}
      </section>
      {children}
    </>
  );
}
