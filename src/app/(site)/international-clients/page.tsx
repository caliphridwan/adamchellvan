import Link from "next/link";
import { PAGE_IMAGES } from "@/lib/placeholder-images";
import type { Metadata } from "next";
import { IconMail, IconWhatsApp } from "@/components/icons";
import { InvestorForm } from "@/components/site/LeadForms";
import { TrackedLink } from "@/components/site/analytics";
import { JsonLd, PageHero } from "@/components/site/common";
import { getLatestArticles } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Buying Property in Nigeria from Abroad | International & Diaspora Clients",
  description:
    "Property sourcing, remote inspections and investor support for Nigerians in the diaspora and international clients interested in Nigerian real estate.",
  alternates: { canonical: "/international-clients" },
};

const STEPS = [
  {
    title: "Share your requirements",
    body: "Tell us where you'd like to buy or invest, your budget, objectives and timeline. We'll arrange a remote consultation at a time that suits your time zone.",
  },
  {
    title: "Property sourcing",
    body: "We identify relevant listings and sourcing options and share the details you need — including what still needs to be verified.",
  },
  {
    title: "Remote inspection",
    body: "Inspections can be arranged in person for your representative, or by live video so you can see the property and its surroundings from abroad.",
  },
  {
    title: "Documentation & due diligence",
    body: "We pay attention to property documentation and coordinate due diligence steps with the lawyer and surveyor you appoint.",
  },
  {
    title: "Negotiation & transaction",
    body: "We support communication and negotiation, and help coordinate the steps through to completion.",
  },
];

const QUESTIONS = [
  "Who is the legal owner, and are they entitled to sell?",
  "What title document does the property have, and has your own lawyer verified it?",
  "Is the land affected by any dispute, encumbrance or government acquisition?",
  "What are the total costs — legal, agency, survey and government charges — and who pays each one?",
  "How will payments be made and documented?",
  "How will inspections, handover and ongoing management work while you are abroad?",
];

export default async function InternationalClientsPage() {
  const [settings, articles] = await Promise.all([getSettings(), getLatestArticles(3)]);
  const wa = whatsappLink(settings.whatsapp, `Hello ${settings.companyName}, I'm based abroad and would like to discuss property in Nigeria.`);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Property sourcing and investor support for international clients",
          provider: { "@type": "RealEstateAgent", name: settings.companyName },
          areaServed: "Nigeria",
          audience: { "@type": "Audience", audienceType: "Nigerians in the diaspora and international investors" },
        }}
      />
      <PageHero
        image={PAGE_IMAGES.international}
        eyebrow="International clients & diaspora"
        title={settings.internationalHeading || "Investing in Nigeria from abroad?"}
        intro={
          settings.internationalBody ||
          "Explore property opportunities in Nigeria with a clearer understanding of the location, listing details, transaction process, and questions to address before committing."
        }
        breadcrumbs={[{ label: "International clients" }]}
      />

      <section className="container py-16 md:py-24" aria-labelledby="how-heading">
        <p className="eyebrow">How it works</p>
        <h2 id="how-heading" className="mt-3 text-display-md">Remote property sourcing, step by step</h2>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-md border border-ivory-200 bg-ivory-200 md:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="bg-white p-7">
              <span className="font-display text-3xl text-champagne-700">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 text-xl">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal-500">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-ivory-200 bg-ivory-50 py-16 md:py-24" aria-labelledby="questions-heading">
        <div className="container grid gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Before you commit</p>
            <h2 id="questions-heading" className="mt-3 text-display-md">Questions every international buyer should ask</h2>
            <ul className="prose-estate mt-6">
              {QUESTIONS.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-charcoal-500">
              This is general information, not legal or financial advice. Always appoint your own lawyer before any transaction.
            </p>
          </div>
          <div>
            <p className="eyebrow">Guides</p>
            <h2 className="mt-3 text-display-md">Understanding the process</h2>
            <ul className="mt-6 divide-y divide-ivory-200 border-y border-ivory-200">
              {(articles.length
                ? articles.map((a) => ({ href: `/insights/${a.slug}`, title: a.title, body: a.excerpt }))
                : [
                    { href: "/insights", title: "Buying property in Nigeria while living abroad", body: "Coming soon" },
                    { href: "/insights", title: "Property documentation and due diligence", body: "Coming soon" },
                    { href: "/insights", title: "Understanding transaction costs and professional fees", body: "Coming soon" },
                  ]
              ).map((g) => (
                <li key={g.title} className="py-4">
                  <Link href={g.href} className="font-display text-xl text-navy-900 hover:text-champagne-700">{g.title}</Link>
                  <p className="mt-1 text-sm text-charcoal-500">{g.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container py-16 md:py-24" aria-labelledby="investor-form-heading">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Get in touch</p>
            <h2 id="investor-form-heading" className="mt-3 text-display-md">Request sourcing assistance or an investor consultation</h2>
            <p className="mt-4 leading-relaxed text-charcoal-700">
              We'll respond by your preferred method and suggest meeting times that suit your time zone.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              {wa ? (
                <TrackedLink event="WhatsApp Click" track="whatsapp" href={wa} target="_blank" rel="noopener noreferrer" className="btn-gold">
                  <IconWhatsApp className="h-4 w-4" /> WhatsApp us
                </TrackedLink>
              ) : null}
              {settings.email ? (
                <TrackedLink event="Email Click" track="email" href={`mailto:${settings.email}`} className="btn-outline">
                  <IconMail className="h-4 w-4" /> {settings.email}
                </TrackedLink>
              ) : null}
            </div>
          </div>
          <div id="investor-form" className="card scroll-mt-24 p-6 md:p-10 lg:col-span-8">
            <InvestorForm idPrefix="intl" />
          </div>
        </div>
      </section>
    </>
  );
}
