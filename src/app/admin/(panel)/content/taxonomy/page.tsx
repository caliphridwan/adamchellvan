import Link from "next/link";
import type { Metadata } from "next";
import { createAmenity, createCategory, createLocation, deleteTaxonomy } from "@/app/admin/actions/content";
import { ActionButton, ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { EntityForm } from "@/components/admin/EntityForm";
import { Card, Notice, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { CATEGORY_GROUPS } from "@/lib/constants";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Taxonomy" };

export default async function TaxonomyPage({ searchParams }: { searchParams: { notice?: string; error?: string } }) {
  await requireUser("content.write");
  const [categories, locations, amenities] = await Promise.all([
    db.propertyCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { properties: true } } } }),
    db.location.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { properties: true } } } }),
    db.amenity.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { properties: true } } } }),
  ]);
  const groupOptions = CATEGORY_GROUPS.map((g) => ({ value: g, label: g.charAt(0) + g.slice(1).toLowerCase() }));

  return (
    <>
      <PageHeader
        title="Categories, locations & amenities"
        description="Locations should be areas the company genuinely serves. Don't create location pages for areas without listings."
        back={{ href: "/admin/content", label: "Content" }}
      />
      <Notice code={searchParams.notice} />
      {searchParams.error === "category-in-use" ? (
        <div role="alert" className="mb-6 rounded border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          That category is used by existing listings. Move those listings to another category first.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Categories">
          <EntityForm
            action={createCategory}
            idPrefix="cat"
            resetOnSuccess
            submitLabel="Add category"
            values={{ group: "RESIDENTIAL" }}
            sections={[{ fields: [
              { type: "text", name: "name", label: "Name", required: true },
              { type: "select", name: "group", label: "Group", options: groupOptions, span: 1 },
              { type: "number", name: "sortOrder", label: "Order", span: 1 },
            ] }]}
          />
          <ul className="mt-6 divide-y divide-ivory-200 text-sm">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <span>
                  {c.name} <span className="text-xs text-charcoal-500">· {c.group.toLowerCase()} · {c._count.properties}</span>
                </span>
                <form action={deleteTaxonomy}>
                  <input type="hidden" name="kind" value="category" />
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmSubmit label="Remove" confirmLabel="Remove" message="Remove?" className="btn-ghost btn-sm px-2 text-xs text-danger" />
                </form>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Locations">
          <EntityForm
            action={createLocation}
            idPrefix="loc"
            resetOnSuccess
            submitLabel="Add location"
            sections={[{ fields: [
              { type: "text", name: "name", label: "Area / neighbourhood", required: true, placeholder: "e.g. Lekki Phase 1" },
              { type: "text", name: "city", label: "City", span: 1 },
              { type: "text", name: "state", label: "State", span: 1, placeholder: "e.g. Lagos" },
              { type: "text", name: "country", label: "Country", span: 1 },
              { type: "number", name: "sortOrder", label: "Order", span: 1 },
            ] }]}
          />
          <ul className="mt-6 divide-y divide-ivory-200 text-sm">
            {locations.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className={l.isActive ? "" : "text-charcoal-400 line-through"}>
                  <Link href={`/admin/content/taxonomy/locations/${l.id}`} className="text-navy-900 underline-offset-2 hover:underline">{l.name}</Link>
                  {l.city ? `, ${l.city}` : ""} <span className="text-xs text-charcoal-500 no-underline">· {l._count.properties}</span>
                </span>
                <form action={deleteTaxonomy}>
                  <input type="hidden" name="id" value={l.id} />
                  {l.isActive ? (
                    <>
                      <input type="hidden" name="kind" value="location" />
                      <ConfirmSubmit
                        label={l._count.properties ? "Hide" : "Remove"}
                        confirmLabel={l._count.properties ? "Hide" : "Remove"}
                        message={l._count.properties ? "Hide from search?" : "Remove?"}
                        className="btn-ghost btn-sm px-2 text-xs text-danger"
                      />
                    </>
                  ) : (
                    <>
                      <input type="hidden" name="kind" value="location-activate" />
                      <ActionButton className="btn-ghost btn-sm px-2 text-xs">Restore</ActionButton>
                    </>
                  )}
                </form>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Amenities">
          <EntityForm
            action={createAmenity}
            idPrefix="am"
            resetOnSuccess
            submitLabel="Add amenity"
            sections={[{ fields: [{ type: "text", name: "name", label: "Name", required: true }] }]}
          />
          <ul className="mt-6 divide-y divide-ivory-200 text-sm">
            {amenities.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <span>
                  {a.name} <span className="text-xs text-charcoal-500">· {a._count.properties}</span>
                </span>
                <form action={deleteTaxonomy}>
                  <input type="hidden" name="kind" value="amenity" />
                  <input type="hidden" name="id" value={a.id} />
                  <ConfirmSubmit label="Remove" confirmLabel="Remove" message="Remove from all listings?" className="btn-ghost btn-sm px-2 text-xs text-danger" />
                </form>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
