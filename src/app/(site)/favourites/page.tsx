import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PropertyGrid } from "@/components/site/PropertyCard";
import { PageHero } from "@/components/site/common";
import { db } from "@/lib/db";
import { FAVOURITES_COOKIE, parseFavourites } from "@/lib/favourites";
import { propertyCardSelect, publicWhere } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Saved properties",
  robots: { index: false, follow: true },
};

export default async function FavouritesPage() {
  const ids = parseFavourites(cookies().get(FAVOURITES_COOKIE)?.value);
  const properties = ids.length
    ? await db.property.findMany({ where: { ...publicWhere, id: { in: ids } }, select: propertyCardSelect })
    : [];
  // Keep the visitor's saved order.
  properties.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

  return (
    <>
      <PageHero eyebrow="Shortlist" title="Saved properties" breadcrumbs={[{ label: "Saved properties" }]} />
      <section className="container py-16 md:py-20">
        {properties.length ? (
          <>
            <p className="mb-8 text-sm text-charcoal-500">
              Saved on this device only. Use the heart icon on any listing to add or remove it.
            </p>
            <PropertyGrid properties={properties} />
          </>
        ) : (
          <div className="card px-8 py-14 text-center">
            <p className="font-display text-3xl text-navy-900">You haven't saved any properties yet</p>
            <p className="mx-auto mt-3 max-w-md text-charcoal-500">Tap the heart on any listing to keep it here for later.</p>
            <Link href="/properties" className="btn-primary mt-8">Browse properties</Link>
          </div>
        )}
      </section>
    </>
  );
}
