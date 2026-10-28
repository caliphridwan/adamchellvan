import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/site/Gallery";
import { ListingStatusPill, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { TRANSACTION_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatArea, formatPrice, paragraphs } from "@/lib/utils";

export const metadata: Metadata = { title: "Preview" };

/** Staff-only preview, including drafts. Mirrors the public listing's main content. */
export default async function PreviewPropertyPage({ params }: { params: { id: string } }) {
  await requireUser("property.read");
  const p = await db.property.findUnique({
    where: { id: params.id },
    include: {
      category: { select: { name: true } },
      location: { select: { name: true } },
      amenities: { select: { name: true }, orderBy: { name: "asc" } },
      media: { where: { kind: "IMAGE" }, orderBy: { sortOrder: "asc" }, select: { id: true, url: true, alt: true } },
    },
  });
  if (!p) notFound();

  const facts = [
    p.bedrooms != null ? `${p.bedrooms} bedrooms` : null,
    p.bathrooms != null ? `${p.bathrooms} bathrooms` : null,
    formatArea(p.floorArea, p.floorAreaUnit),
    formatArea(p.plotSize, p.plotSizeUnit),
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title="Listing preview"
        description="This is how the main listing content will appear. Private fields are not shown publicly."
        back={{ href: `/admin/properties/${p.id}`, label: "Back to editor" }}
      />
      <div className="rounded-md border border-ivory-200 bg-ivory-50 p-4 md:p-8">
        <Gallery images={p.media} title={p.title} />
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="badge bg-navy-900 text-ivory-50">{TRANSACTION_LABELS[p.transactionType]}</span>
          <ListingStatusPill status={p.status} published={p.isPublished} />
          <span className="badge bg-ivory-200 text-charcoal-700">{p.category.name}</span>
        </div>
        <h2 className="mt-4 text-display-md">{p.title}</h2>
        <p className="mt-2 text-charcoal-500">{[p.displayAddress, p.location.name].filter(Boolean).join(", ")}</p>
        <p className="mt-4 font-display text-3xl font-semibold text-navy-900">{formatPrice(p)}</p>
        {facts.length ? <p className="mt-3 text-sm text-charcoal-700">{facts.join(" · ")}</p> : null}
        {p.summary ? <p className="mt-6 text-lg text-navy-900">{p.summary}</p> : null}
        <div className="prose-estate mt-4">
          {paragraphs(p.description).map((para, i) => (
            <p key={i} className="whitespace-pre-line">{para}</p>
          ))}
        </div>
        {p.amenities.length ? <p className="mt-4 text-sm text-charcoal-700">Amenities: {p.amenities.map((a) => a.name).join(", ")}</p> : null}
      </div>
    </>
  );
}
