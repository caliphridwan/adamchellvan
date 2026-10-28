import Link from "next/link";
import { PAGE_IMAGES } from "@/lib/placeholder-images";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequirementForm } from "@/components/site/LeadForms";
import { PropertyGrid } from "@/components/site/PropertyCard";
import { PageHero, RichText } from "@/components/site/common";
import { db } from "@/lib/db";
import { getLandingProperties } from "@/lib/queries";

type Props = { params: { slug: string } };

// Area guides exist only for locations the business genuinely serves. To avoid thin pages,
// an area page is indexable only when it has a written guide AND at least one live listing.
async function getArea(slug: string) {
  return db.location.findFirst({ where: { slug, isActive: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const area = await getArea(params.slug);
  if (!area) return { title: "Area not found", robots: { index: false } };
  const { total } = await getLandingProperties({ locationId: area.id }, 0);
  const place = [area.name, area.city, area.state].filter(Boolean).join(", ");
  return {
    title: `Property in ${place}`,
    description: area.description?.slice(0, 155) || `Properties for sale, rent and lease in ${place}.`,
    alternates: { canonical: `/areas/${area.slug}` },
    robots: area.description && total > 0 ? undefined : { index: false, follow: true },
  };
}

export default async function AreaPage({ params }: Props) {
  const area = await getArea(params.slug);
  if (!area) notFound();
  const { total, properties } = await getLandingProperties({ locationId: area.id }, 9);
  const place = [area.city, area.state].filter(Boolean).join(", ");

  return (
    <>
      <PageHero
        image={PAGE_IMAGES.areas}
        eyebrow={place || "Area guide"}
        title={`Property in ${area.name}`}
        breadcrumbs={[{ label: "Properties", href: "/properties" }, { label: area.name }]}
      />
      {area.description ? (
        <section className="container max-w-3xl py-14">
          <RichText text={area.description} />
        </section>
      ) : null}
      <section className="container pb-16" aria-labelledby="area-listings">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 id="area-listings" className="text-display-md">Listings in {area.name}</h2>
          {total > 0 ? (
            <Link href={`/properties?location=${area.slug}`} className="text-sm font-semibold uppercase tracking-[0.14em] text-navy-900 hover:text-champagne-700">
              View all {total} →
            </Link>
          ) : null}
        </div>
        {properties.length ? (
          <PropertyGrid properties={properties} />
        ) : (
          <p className="text-charcoal-500">There are no live listings in {area.name} right now.</p>
        )}
      </section>
      <section className="border-t border-ivory-200 bg-ivory-50 py-16" aria-labelledby="area-req">
        <div className="container grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="area-req" className="text-display-md">Looking in {area.name}?</h2>
            <p className="mt-4 text-charcoal-700">Share your requirements and we'll look for suitable options.</p>
          </div>
          <div className="card p-6 md:p-10 lg:col-span-8">
            <RequirementForm idPrefix="area-req" compact />
          </div>
        </div>
      </section>
    </>
  );
}
