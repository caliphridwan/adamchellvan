import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { ACTIVE_STATUSES, PUBLIC_STATUSES } from "./constants";

// ─── Public read queries. All of them enforce isPublished + a public status. ───

export const propertyCardSelect = Prisma.validator<Prisma.PropertySelect>()({
  id: true,
  slug: true,
  reference: true,
  title: true,
  transactionType: true,
  status: true,
  isFeatured: true,
  isInvestment: true,
  price: true,
  priceOnRequest: true,
  pricePeriod: true,
  currency: true,
  bedrooms: true,
  bathrooms: true,
  floorArea: true,
  floorAreaUnit: true,
  plotSize: true,
  plotSizeUnit: true,
  displayAddress: true,
  category: { select: { name: true, group: true } },
  location: { select: { name: true } },
  media: {
    where: { kind: "IMAGE" },
    orderBy: { sortOrder: "asc" },
    take: 1,
    select: { url: true, alt: true },
  },
  _count: { select: { media: { where: { kind: "IMAGE" } } } },
});

export type PropertyCardData = Prisma.PropertyGetPayload<{ select: typeof propertyCardSelect }>;

export const publicWhere: Prisma.PropertyWhereInput = {
  isPublished: true,
  status: { in: [...PUBLIC_STATUSES] },
};

const activeWhere: Prisma.PropertyWhereInput = {
  isPublished: true,
  status: { in: [...ACTIVE_STATUSES] },
};

export async function getFeaturedProperties(take = 6): Promise<PropertyCardData[]> {
  return db.property.findMany({
    where: { ...activeWhere, isFeatured: true },
    orderBy: [{ publishedAt: "desc" }],
    take,
    select: propertyCardSelect,
  });
}

export async function getRecentProperties(take = 6, excludeIds: string[] = []): Promise<PropertyCardData[]> {
  return db.property.findMany({
    where: { ...activeWhere, ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}) },
    orderBy: [{ publishedAt: "desc" }],
    take,
    select: propertyCardSelect,
  });
}

export async function getPropertyBySlug(slug: string) {
  return db.property.findFirst({
    where: { ...publicWhere, slug },
    select: {
      id: true,
      slug: true,
      reference: true,
      title: true,
      summary: true,
      description: true,
      transactionType: true,
      status: true,
      price: true,
      priceOnRequest: true,
      pricePeriod: true,
      currency: true,
      displayAddress: true,
      showMap: true,
      mapQuery: true,
      bedrooms: true,
      bathrooms: true,
      toilets: true,
      parkingSpaces: true,
      floorArea: true,
      floorAreaUnit: true,
      plotSize: true,
      plotSizeUnit: true,
      yearBuilt: true,
      furnishing: true,
      estate: true,
      isInvestment: true,
      titleDocument: true,
      videoUrl: true,
      virtualTourUrl: true,
      seoTitle: true,
      seoDescription: true,
      publishedAt: true,
      updatedAt: true,
      categoryId: true,
      locationId: true,
      category: { select: { name: true, slug: true, group: true } },
      location: { select: { name: true, slug: true, city: true, state: true, country: true } },
      amenities: { select: { name: true, slug: true }, orderBy: { name: "asc" } },
      media: {
        orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
        select: { id: true, kind: true, url: true, alt: true, width: true, height: true },
      },
      // NOTE: privateAddress, privateNotes, ownerName and ownerContact are deliberately not selected.
    },
  });
}

export type PropertyDetail = NonNullable<Awaited<ReturnType<typeof getPropertyBySlug>>>;

export async function getSimilarProperties(p: { id: string; categoryId: string; locationId: string; transactionType: PropertyDetail["transactionType"] }) {
  return db.property.findMany({
    where: {
      ...activeWhere,
      id: { not: p.id },
      transactionType: p.transactionType,
      OR: [{ categoryId: p.categoryId }, { locationId: p.locationId }],
    },
    orderBy: [{ publishedAt: "desc" }],
    take: 3,
    select: propertyCardSelect,
  });
}

/** Options for search dropdowns — only taxonomy that has at least one public listing, plus all active locations. */
export async function getFilterOptions() {
  const [categories, locations, amenities] = await Promise.all([
    db.propertyCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true, slug: true, group: true, _count: { select: { properties: { where: activeWhere } } } },
    }),
    db.location.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true, slug: true, state: true, _count: { select: { properties: { where: activeWhere } } } },
    }),
    db.amenity.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true, _count: { select: { properties: { where: activeWhere } } } },
    }),
  ]);
  const states = Array.from(new Set(locations.map((l) => l.state).filter((x): x is string => Boolean(x)))).sort();
  return {
    categories,
    locations,
    states,
    amenities: amenities.filter((a) => a._count.properties > 0),
  };
}

export async function getPublishedServices() {
  return db.service.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { slug: true, title: true, summary: true },
  });
}

export async function getPublishedTestimonials(take = 6) {
  return db.testimonial.findMany({
    where: { isPublished: true, isAuthorised: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take,
  });
}

export async function getLatestArticles(take = 3) {
  return db.article.findMany({
    where: { isPublished: true, publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: "desc" },
    take,
    select: { slug: true, title: true, excerpt: true, coverImageUrl: true, coverImageAlt: true, publishedAt: true },
  });
}

export async function getInvestmentProperties(take = 6): Promise<PropertyCardData[]> {
  return db.property.findMany({
    where: { ...activeWhere, isInvestment: true },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take,
    select: propertyCardSelect,
  });
}

/** Listings matching a partial filter, for landing pages (always public-only). */
export async function getLandingProperties(where: Prisma.PropertyWhereInput, take = 9) {
  const fullWhere: Prisma.PropertyWhereInput = { ...where, ...activeWhere };
  const [total, properties] = await Promise.all([
    db.property.count({ where: fullWhere }),
    db.property.findMany({ where: fullWhere, orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }], take, select: propertyCardSelect }),
  ]);
  return { total, properties };
}
