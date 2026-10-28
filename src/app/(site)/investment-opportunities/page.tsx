import Link from "next/link";
import { PAGE_IMAGES } from "@/lib/placeholder-images";
import type { Metadata } from "next";
import { IconCheck } from "@/components/icons";
import { InvestorForm } from "@/components/site/LeadForms";
import { ListingLanding } from "@/components/site/ListingLanding";

export const metadata: Metadata = {
  title: "Real Estate Investment Opportunities in Nigeria",
  description: "Explore land, commercial and residential property investment opportunities in Nigeria, with property sourcing and investor support.",
  alternates: { canonical: "/investment-opportunities" },
};

const SUPPORT = [
  "Property and land sourcing matched to your objectives and budget",
  "Clear listing details, including what still needs to be verified",
  "Inspections — in person or by live video if you're abroad",
  "Documentation and due diligence coordination with your legal adviser",
  "Professional communication and negotiation support",
];

export default function InvestmentPage() {
  return (
    <ListingLanding
      image={PAGE_IMAGES.investment}
      eyebrow="Invest"
      title="Investment opportunities"
      intro="Property sourcing and support evaluating real estate opportunities in Nigeria — land, commercial and residential — for local and international investors."
      breadcrumbs={[{ label: "Investment opportunities" }]}
      where={{ isInvestment: true }}
      searchHref="/properties?investment=1"
      listingsHeading="Current opportunities"
      emptyText="No investment listings are published right now"
      quickLinks={[
        { href: "/properties?investment=1&group=land", label: "Land" },
        { href: "/properties?investment=1&group=commercial", label: "Commercial" },
        { href: "/properties?investment=1&group=residential", label: "Residential" },
        { href: "/international-clients", label: "Investing from abroad" },
      ]}
    >
      <section className="border-t border-ivory-200 bg-ivory-50 py-16 md:py-20" aria-labelledby="inv-support">
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Investor support</p>
            <h2 id="inv-support" className="mt-3 text-display-md">Make informed decisions</h2>
            <ul className="mt-6 space-y-4">
              {SUPPORT.map((s) => (
                <li key={s} className="flex gap-3 text-charcoal-700">
                  <IconCheck className="mt-1 h-4 w-4 shrink-0 text-champagne-700" />
                  {s}
                </li>
              ))}
            </ul>
            <p className="mt-8 rounded border border-ivory-300 bg-white px-4 py-3 text-sm leading-relaxed text-charcoal-500">
              We do not guarantee returns, ownership verification or investment performance. Every opportunity should be
              independently assessed, and investors should take their own legal and financial advice.
            </p>
            <Link href="/insights" className="mt-6 inline-block text-sm font-semibold uppercase tracking-[0.14em] text-navy-900 hover:text-champagne-700">
              Read our investor guides →
            </Link>
          </div>
          <div id="investor-form" className="card scroll-mt-24 p-6 md:p-10 lg:col-span-7">
            <h3 className="font-display text-3xl">Investor enquiry</h3>
            <p className="mt-2 text-sm text-charcoal-500">Tell us about your objectives and we'll arrange a consultation.</p>
            <div className="mt-6">
              <InvestorForm idPrefix="inv-page" />
            </div>
          </div>
        </div>
      </section>
    </ListingLanding>
  );
}
