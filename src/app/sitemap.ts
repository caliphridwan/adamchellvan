import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { publicWhere } from "@/lib/queries";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, services, articles, areas] = await Promise.all([
    db.property.findMany({ where: publicWhere, select: { slug: true, updatedAt: true } }),
    db.service.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    db.article.findMany({ where: { isPublished: true, publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true } }),
    // Only areas with a written guide and at least one live listing (no thin location pages).
    db.location.findMany({
      where: { isActive: true, description: { not: null }, properties: { some: publicWhere } },
      select: { slug: true },
    }),
  ]);
  const staticPages = [
    "/",
    "/properties",
    "/rent-and-lease",
    "/land-and-commercial",
    "/investment-opportunities",
    "/international-clients",
    "/services",
    "/about",
    "/contact",
    "/faq",
    "/insights",
    "/list-your-property",
    "/privacy",
    "/terms",
  ];
  return [
    ...staticPages.map((p) => ({ url: absoluteUrl(p), changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.6 })),
    ...properties.map((p) => ({ url: absoluteUrl(`/properties/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...services.map((s) => ({ url: absoluteUrl(`/services/${s.slug}`), lastModified: s.updatedAt, priority: 0.6 })),
    ...articles.map((a) => ({ url: absoluteUrl(`/insights/${a.slug}`), lastModified: a.updatedAt, priority: 0.5 })),
    ...areas.map((a) => ({ url: absoluteUrl(`/areas/${a.slug}`), changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
