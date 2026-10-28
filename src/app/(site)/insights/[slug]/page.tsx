import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, JsonLd, RichText } from "@/components/site/common";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, formatDate, isOptimisableImage } from "@/lib/utils";

type Props = { params: { slug: string } };

async function getArticle(slug: string) {
  return db.article.findFirst({
    where: { slug, isPublished: true, publishedAt: { lte: new Date() } },
    include: { author: { select: { name: true } } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getArticle(params.slug);
  if (!a) return { title: "Article not found", robots: { index: false } };
  return {
    title: a.seoTitle || a.title,
    description: a.seoDescription || a.excerpt,
    alternates: { canonical: `/insights/${a.slug}` },
    openGraph: {
      type: "article",
      title: a.title,
      description: a.excerpt,
      publishedTime: a.publishedAt?.toISOString(),
      ...(a.coverImageUrl ? { images: [{ url: a.coverImageUrl }] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const [article, settings] = await Promise.all([getArticle(params.slug), getSettings()]);
  if (!article) notFound();

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt,
          datePublished: article.publishedAt?.toISOString(),
          dateModified: article.updatedAt.toISOString(),
          mainEntityOfPage: absoluteUrl(`/insights/${article.slug}`),
          ...(article.coverImageUrl ? { image: [article.coverImageUrl] } : {}),
          ...(article.author ? { author: { "@type": "Person", name: article.author.name } } : {}),
          publisher: { "@type": "Organization", name: settings.companyName },
        }}
      />
      <header className="container max-w-3xl pb-10 pt-10 md:pt-14">
        <Breadcrumbs items={[{ label: "Insights", href: "/insights" }, { label: article.title }]} />
        <p className="mt-10 text-xs uppercase tracking-[0.14em] text-charcoal-500">
          {formatDate(article.publishedAt, { day: "numeric", month: "long", year: "numeric" })}
          {article.author ? ` · ${article.author.name}` : ""}
        </p>
        <h1 className="mt-3 text-display-lg">{article.title}</h1>
        <p className="mt-5 text-xl leading-relaxed text-charcoal-500">{article.excerpt}</p>
      </header>
      {article.coverImageUrl ? (
        <div className="container max-w-5xl">
          <div className="relative aspect-[16/8] overflow-hidden rounded-md bg-ivory-200">
            <Image src={article.coverImageUrl} unoptimized={!isOptimisableImage(article.coverImageUrl)} alt={article.coverImageAlt ?? ""} fill priority sizes="(min-width: 1024px) 1000px, 100vw" className="object-cover" />
          </div>
        </div>
      ) : null}
      <div className="container max-w-3xl py-12 md:py-16">
        <RichText text={article.body} />
        <div className="mt-14 border-t border-ivory-200 pt-8">
          <Link href="/insights" className="text-sm font-semibold uppercase tracking-[0.14em] text-navy-900 hover:text-champagne-700">
            ← All insights
          </Link>
        </div>
      </div>
    </article>
  );
}
