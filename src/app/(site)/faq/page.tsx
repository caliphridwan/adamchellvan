import Link from "next/link";
import { PAGE_IMAGES } from "@/lib/placeholder-images";
import type { Metadata } from "next";
import { IconChevronDown } from "@/components/icons";
import { JsonLd, PageHero } from "@/components/site/common";
import { db } from "@/lib/db";
import { paragraphs } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers to common questions about buying, selling, renting and investing in property with us.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqs = await db.faq.findMany({ where: { isPublished: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return (
    <>
      {faqs.length ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }}
        />
      ) : null}
      <PageHero
        image={PAGE_IMAGES.faq} eyebrow="Help" title="Frequently asked questions" breadcrumbs={[{ label: "FAQs" }]} />
      <section className="container max-w-4xl py-16 md:py-20">
        {faqs.length ? (
          <ul className="divide-y divide-ivory-200 border-y border-ivory-200">
            {faqs.map((f) => (
              <li key={f.id}>
                <details className="group">
                  <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-2xl text-navy-900 [&::-webkit-details-marker]:hidden">
                    {f.question}
                    <IconChevronDown className="h-5 w-5 shrink-0 text-champagne-700 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-4 pb-6 leading-relaxed text-charcoal-700">
                    {paragraphs(f.answer).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-charcoal-500">Our FAQs are being prepared.</p>
        )}
        <div className="mt-14 text-center">
          <p className="font-display text-2xl text-navy-900">Still have a question?</p>
          <Link href="/contact" className="btn-primary mt-6">Contact our team</Link>
        </div>
      </section>
    </>
  );
}
