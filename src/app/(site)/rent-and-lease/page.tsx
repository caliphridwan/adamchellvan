import type { Metadata } from "next";
import { PAGE_IMAGES } from "@/lib/placeholder-images";
import { RequirementForm } from "@/components/site/LeadForms";
import { ListingLanding } from "@/components/site/ListingLanding";

export const metadata: Metadata = {
  title: "Properties for Rent & Lease in Lagos and Nigeria",
  description: "Residential and commercial properties to rent or lease — apartments, houses, offices, shops and warehouses.",
  alternates: { canonical: "/rent-and-lease" },
};

export default function RentAndLeasePage() {
  return (
    <ListingLanding
      image={PAGE_IMAGES.rentAndLease}
      eyebrow="Rent & lease"
      title="Residential and commercial rental listings"
      intro="Homes, apartments and duplexes to rent, and offices, retail spaces and warehouses to lease. Inspections can be arranged at a time that suits you."
      breadcrumbs={[{ label: "Rent & lease" }]}
      where={{ transactionType: { in: ["RENT", "LEASE"] } }}
      searchHref="/properties?type=LET"
      listingsHeading="Available to rent or lease"
      emptyText="No rental listings are available right now"
      quickLinks={[
        { href: "/properties?type=LET&group=residential", label: "Homes to rent" },
        { href: "/properties?type=LET&group=commercial", label: "Commercial to lease" },
        { href: "/properties?type=LET&group=industrial", label: "Warehouses" },
        { href: "/properties?type=LET&furnishing=FURNISHED", label: "Furnished" },
        { href: "/list-your-property", label: "Landlords: list your property" },
      ]}
    >
      <section className="border-t border-ivory-200 bg-ivory-50 py-16 md:py-20" aria-labelledby="rent-req">
        <div className="container grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Can't find the right place?</p>
            <h2 id="rent-req" className="mt-3 text-display-md">Tell us what you need</h2>
            <p className="mt-4 leading-relaxed text-charcoal-700">
              Share your preferred location, budget and move-in timeline and we'll respond with suitable options where available.
            </p>
          </div>
          <div className="card p-6 md:p-10 lg:col-span-8">
            <RequirementForm idPrefix="rent-req" />
          </div>
        </div>
      </section>
    </ListingLanding>
  );
}
