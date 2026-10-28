import type { Metadata } from "next";
import { PAGE_IMAGES } from "@/lib/placeholder-images";
import { ListingSubmissionForm } from "@/components/site/ListingSubmissionForm";
import { PageHero } from "@/components/site/common";
import { getSettings } from "@/lib/settings";
import { isStorageConfigured } from "@/lib/upload";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: "List your property",
    description: `Submit your property to ${s.companyName} for sale, rent or lease.`,
    alternates: { canonical: "/list-your-property" },
  };
}

export default function ListYourPropertyPage() {
  return (
    <>
      <PageHero
        image={PAGE_IMAGES.listYourProperty}
        eyebrow="Property owners"
        title="List your property with us"
        intro="Are you a property owner, landlord or developer looking to sell, let or lease? Share a few details and our team will review your submission and contact you about next steps. Nothing is published until it has been reviewed and agreed with you."
        breadcrumbs={[{ label: "List your property" }]}
      />
      <section className="container max-w-3xl py-16 md:py-20">
        <div className="card p-6 md:p-10">
          <ListingSubmissionForm photosEnabled={isStorageConfigured()} />
        </div>
      </section>
    </>
  );
}
