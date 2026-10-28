import Image from "next/image";
import { PAGE_IMAGES, articleFallback } from "@/lib/placeholder-images";
import { StockFill } from "@/components/site/StockPhoto";
import Link from "next/link";
import type { Metadata } from "next";
import { Pagination } from "@/components/site/Pagination";
import { PageHero } from "@/components/site/common";
import { db } from "@/lib/db";
import { formatDate, isOptimisableImage } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Insights",
  description: "Property news, market insights and guidance.",
  alternates: { canonical: "/insights" },
};

const PER_PAGE = 9;

export default async function InsightsPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, Math.min(200, Number.parseInt(searchParams.page ?? "1", 10) || 1));
  const where = { isPublished: true, publishedAt: { lte: new Date() } };
  const [total, articles] = await Promise.all([
    db.article.count({ where }),
    db.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: { slug: true, title: true, excerpt: true, coverImageUrl: true, coverImageAlt: true, publishedAt: true },
    }),
  ]);

  return (
    <>
      <PageHero
        image={PAGE_IMAGES.insights} eyebrow="Insights" title="News & property insights" breadcrumbs={[{ label: "Insights" }]} />
      <section className="container py-16 md:py-20">
        {articles.length ? (
          <>
            <ul className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <li key={a.slug} className="group relative">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-ivory-200">
                    {a.coverImageUrl ? (
                      <Image src={a.coverImageUrl} unoptimized={!isOptimisableImage(a.coverImageUrl)} alt={a.coverImageAlt ?? ""} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                    ) : (
                      <StockFill image={articleFallback(a.slug)} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="transition-transform duration-700 group-hover:scale-[1.03]" />
                    )}
                  </div>
                  <p className="mt-5 text-xs uppercase tracking-[0.14em] text-charcoal-500">{formatDate(a.publishedAt)}</p>
                  <h2 className="mt-2 text-2xl leading-snug">
                    <Link href={`/insights/${a.slug}`} className="after:absolute after:inset-0">{a.title}</Link>
                  </h2>
                  <p className="mt-2 line-clamp-3 leading-relaxed text-charcoal-500">{a.excerpt}</p>
                </li>
              ))}
            </ul>
            <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} hrefFor={(p) => (p > 1 ? `/insights?page=${p}` : "/insights")} />
          </>
        ) : (
          <p className="text-charcoal-500">No articles have been published yet.</p>
        )}
      </section>
    </>
  );
}
