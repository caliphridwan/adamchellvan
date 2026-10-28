import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateLocation } from "@/app/admin/actions/content";
import { EntityForm } from "@/components/admin/EntityForm";
import { PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Edit location" };

export default async function EditLocationPage({ params }: { params: { id: string } }) {
  await requireUser("content.write");
  const l = await db.location.findUnique({ where: { id: params.id }, include: { _count: { select: { properties: true } } } });
  if (!l) notFound();
  return (
    <>
      <PageHeader
        title={l.name}
        description={
          <>
            {l._count.properties} listing(s) · public page{" "}
            <Link href={`/areas/${l.slug}`} target="_blank" className="underline">/areas/{l.slug}</Link> (indexed by search engines only once it has a guide and a live listing)
          </>
        }
        back={{ href: "/admin/content/taxonomy", label: "Taxonomy" }}
      />
      <EntityForm
        action={updateLocation.bind(null, l.id)}
        submitLabel="Save location"
        values={{ name: l.name, city: l.city, state: l.state, country: l.country, sortOrder: l.sortOrder, description: l.description }}
        sections={[
          {
            fields: [
              { type: "text", name: "name", label: "Area / neighbourhood", required: true, span: 1 },
              { type: "text", name: "city", label: "City", span: 1 },
              { type: "text", name: "state", label: "State", span: 1 },
              { type: "text", name: "country", label: "Country", span: 1 },
              { type: "number", name: "sortOrder", label: "Order", span: 1 },
              {
                type: "textarea",
                name: "description",
                label: "Area guide",
                rows: 10,
                hint: "Original, genuinely useful information about the area (access, amenities, property types, who it suits). Use “## Heading” and “- item”. Only write guides for areas you actively serve.",
              },
            ],
          },
        ]}
      />
    </>
  );
}
