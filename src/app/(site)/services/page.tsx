import Link from "next/link";
import { PAGE_IMAGES } from "@/lib/placeholder-images";
import type { Metadata } from "next";
import { IconArrowRight } from "@/components/icons";
import { PageHero } from "@/components/site/common";
import { getPublishedServices } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: "Services",
    description: `Real estate services offered by ${s.companyName}.`,
    alternates: { canonical: "/services" },
  };
}

export default async function ServicesPage() {
  const services = await getPublishedServices();
  return (
    <>
      <PageHero
        image={PAGE_IMAGES.services} eyebrow="What we do" title="Our services" breadcrumbs={[{ label: "Services" }]} />
      <section className="container py-16 md:py-24">
        {services.length ? (
          <ul className="divide-y divide-ivory-200 border-y border-ivory-200">
            {services.map((s, i) => (
              <li key={s.slug} className="group relative grid gap-4 py-10 md:grid-cols-[80px_1fr_auto] md:items-center md:gap-10">
                <span className="font-display text-2xl text-champagne-700">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h2 className="text-3xl md:text-4xl">
                    <Link href={`/services/${s.slug}`} className="after:absolute after:inset-0">
                      {s.title}
                    </Link>
                  </h2>
                  <p className="mt-3 max-w-2xl leading-relaxed text-charcoal-500">{s.summary}</p>
                </div>
                <IconArrowRight className="hidden h-6 w-6 text-champagne-700 transition-transform group-hover:translate-x-1 md:block" />
              </li>
            ))}
          </ul>
        ) : (
          <div className="card p-10 text-center">
            <p className="font-display text-3xl text-navy-900">Service details are being prepared</p>
            <p className="mt-3 text-charcoal-500">Please contact us to discuss how we can help.</p>
            <Link href="/contact" className="btn-primary mt-8">Contact us</Link>
          </div>
        )}
      </section>
    </>
  );
}
