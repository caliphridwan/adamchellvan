import Link from "next/link";
import { PAGE_IMAGES } from "@/lib/placeholder-images";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnquiryFormInner } from "@/components/site/EnquiryForm";
import { PageHero, RichText } from "@/components/site/common";
import { db } from "@/lib/db";
import { getPublishedServices } from "@/lib/queries";

type Props = { params: { slug: string } };

async function getService(slug: string) {
  return db.service.findFirst({ where: { slug, isPublished: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await getService(params.slug);
  if (!s) return { title: "Service not found", robots: { index: false } };
  return {
    title: s.seoTitle || s.title,
    description: s.seoDescription || s.summary,
    alternates: { canonical: `/services/${s.slug}` },
  };
}

export default async function ServicePage({ params }: Props) {
  const [service, all] = await Promise.all([getService(params.slug), getPublishedServices()]);
  if (!service) notFound();
  const others = all.filter((s) => s.slug !== service.slug);

  return (
    <>
      <PageHero
        image={PAGE_IMAGES.services}
        eyebrow="Service"
        title={service.title}
        intro={service.summary}
        breadcrumbs={[{ label: "Services", href: "/services" }, { label: service.title }]}
      />
      <div className="container grid gap-14 py-16 md:py-20 lg:grid-cols-[1fr_400px]">
        <div>
          <RichText text={service.body} />
          {others.length ? (
            <nav aria-label="Other services" className="mt-16 border-t border-ivory-200 pt-10">
              <h2 className="text-2xl">Other services</h2>
              <ul className="mt-5 flex flex-wrap gap-3">
                {others.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/services/${o.slug}`} className="btn-outline btn-sm">{o.title}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
        <aside aria-label="Enquire about this service">
          <div className="card p-6 md:p-8 lg:sticky lg:top-[100px]">
            <h2 className="text-3xl">Discuss {service.title.toLowerCase()}</h2>
            <p className="mt-2 text-sm text-charcoal-500">Send us a few details and we'll be in touch.</p>
            <div className="mt-6">
              <EnquiryFormInner
                type="CONSULTATION"
                source={`/services/${service.slug}`}
                defaultMessage={`I'd like to discuss your ${service.title.toLowerCase()} service.`}
              />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
