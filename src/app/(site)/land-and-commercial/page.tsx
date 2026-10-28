import type { Metadata } from "next";
import { PAGE_IMAGES } from "@/lib/placeholder-images";
import { RequirementForm } from "@/components/site/LeadForms";
import { ListingLanding } from "@/components/site/ListingLanding";

export const metadata: Metadata = {
  title: "Land and Commercial Property in Lagos and Nigeria",
  description: "Land for sale, development sites, offices, retail spaces and warehouses for sale or lease in Lagos and across Nigeria.",
  alternates: { canonical: "/land-and-commercial" },
};

export default function LandAndCommercialPage() {
  return (
    <ListingLanding
      image={PAGE_IMAGES.landAndCommercial}
      eyebrow="Land & commercial"
      title="Land, development sites and business premises"
      intro="Land acquisition, offices, retail spaces, warehouses and mixed-use buildings — with attention to documentation and due diligence coordination before you commit."
      breadcrumbs={[{ label: "Land & commercial" }]}
      where={{ category: { group: { in: ["LAND", "COMMERCIAL", "INDUSTRIAL"] } } }}
      searchHref="/properties?group=commercial"
      listingsHeading="Current land & commercial listings"
      emptyText="No land or commercial listings are available right now"
      quickLinks={[
        { href: "/properties?group=land&type=SALE", label: "Land for sale" },
        { href: "/properties?group=commercial&type=SALE", label: "Commercial for sale" },
        { href: "/properties?group=commercial&type=LET", label: "Offices & shops to lease" },
        { href: "/properties?group=industrial", label: "Warehouses" },
        { href: "/investment-opportunities", label: "Investment opportunities" },
      ]}
    >
      <section className="border-t border-ivory-200 bg-ivory-50 py-16 md:py-20" aria-labelledby="lc-req">
        <div className="container grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Property sourcing</p>
            <h2 id="lc-req" className="mt-3 text-display-md">Looking for land or premises?</h2>
            <p className="mt-4 leading-relaxed text-charcoal-700">
              Tell us the size, location and intended use, and our team will review your requirements and look for suitable options.
            </p>
          </div>
          <div className="card p-6 md:p-10 lg:col-span-8">
            <RequirementForm idPrefix="lc-req" />
          </div>
        </div>
      </section>
    </ListingLanding>
  );
}
