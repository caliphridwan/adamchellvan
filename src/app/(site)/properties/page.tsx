import Link from "next/link";
import { PAGE_IMAGES } from "@/lib/placeholder-images";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterPanel } from "@/components/site/FilterPanel";
import { Pagination } from "@/components/site/Pagination";
import { PropertyGrid } from "@/components/site/PropertyCard";
import { SortSelect } from "@/components/site/SortSelect";
import { PageHero } from "@/components/site/common";
import { PAGE_SIZE, SEARCH_GROUP_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { getFilterOptions, propertyCardSelect } from "@/lib/queries";
import {
  buildPropertyOrderBy,
  buildPropertyWhere,
  filtersToQuery,
  hasActiveFilters,
  paginationArgs,
  parseSearchParams,
  type RawSearchParams,
} from "@/lib/search";

type Props = { searchParams: RawSearchParams };

const TYPE_TITLES = { SALE: "for sale", RENT: "for rent", LEASE: "for lease", LET: "to rent or lease" } as const;

function pageTitle(f: ReturnType<typeof parseSearchParams>): string {
  const what = f.investment ? "Investment properties" : f.group ? `${SEARCH_GROUP_LABELS[f.group]} properties` : "Properties";
  return f.type ? `${what} ${TYPE_TITLES[f.type]}` : what;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = parseSearchParams(searchParams);
  const title = `${pageTitle(f)} in Lagos & Nigeria`;
  // Filtered/paginated views are useful to people but are near-duplicates for search engines.
  const filtered = hasActiveFilters(f) || f.page > 1 || f.sort !== "newest";
  const onlyType = f.type && !filtered ? `?type=${f.type}` : "";
  return {
    title,
    description: "Browse available properties: search by location, property type, price and more.",
    alternates: { canonical: `/properties${onlyType}` },
    robots: filtered && !(f.type && Object.keys(searchParams).length === 1) ? { index: false, follow: true } : undefined,
  };
}

export default async function PropertiesPage({ searchParams }: Props) {
  const filters = parseSearchParams(searchParams);
  const where = buildPropertyWhere(filters);
  const [options, total, properties] = await Promise.all([
    getFilterOptions(),
    db.property.count({ where }),
    db.property.findMany({
      where,
      orderBy: buildPropertyOrderBy(filters.sort),
      ...paginationArgs(filters.page),
      select: propertyCardSelect,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const active = hasActiveFilters(filters);

  return (
    <>
      <PageHero
        image={PAGE_IMAGES.properties}
        eyebrow="Property search"
        title={hasActiveFilters(filters) ? pageTitle(filters) : "Find a property"}
        breadcrumbs={[{ label: "Properties" }]}
      />
      <section className="container py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
          <aside aria-label="Search filters">
            <FilterPanel
              filters={filters}
              categories={options.categories}
              locations={options.locations}
              amenities={options.amenities}
              states={options.states}
            />
          </aside>

          <div>
            <div className="mb-8 flex flex-col gap-4 border-b border-ivory-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-charcoal-700" aria-live="polite">
                <span className="font-semibold text-navy-900">{total.toLocaleString("en")}</span>{" "}
                {total === 1 ? "property" : "properties"}
                {active ? " match your search" : " available"}
              </p>
              <Suspense fallback={null}>
                <SortSelect value={filters.sort} />
              </Suspense>
            </div>

            {properties.length ? (
              <>
                <PropertyGrid properties={properties} priorityCount={2} />
                <Pagination
                  page={filters.page}
                  totalPages={totalPages}
                  hrefFor={(p) => `/properties${filtersToQuery(filters, { page: p })}`}
                />
              </>
            ) : (
              <div className="card px-8 py-14 text-center">
                <p className="font-display text-3xl text-navy-900">
                  {active ? "No properties match these filters" : "No properties are listed right now"}
                </p>
                <p className="mx-auto mt-3 max-w-md text-charcoal-500">
                  {active
                    ? "Try widening your price range or removing a filter. You can also tell us what you need and we'll look for you."
                    : "New listings are added regularly. Tell us what you're looking for and we'll be in touch."}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {active ? (
                    <Link href="/properties" className="btn-outline">Reset filters</Link>
                  ) : null}
                  <Link href="/contact?type=CONSULTATION" className="btn-primary">Tell us your requirements</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
