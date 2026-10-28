import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { archiveProperty, deleteProperty, saveProperty, setPublished } from "@/app/admin/actions/properties";
import { ActionButton, ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { EntityForm } from "@/components/admin/EntityForm";
import { MediaManager } from "@/components/admin/MediaManager";
import { Card, ListingStatusPill, Notice, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { PUBLIC_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { getSettings } from "@/lib/settings";
import { isStorageConfigured } from "@/lib/upload";
import { formatDate } from "@/lib/utils";
import { propertySections, propertyValues } from "../form-config";

export const metadata: Metadata = { title: "Edit property" };

export default async function EditPropertyPage({ params, searchParams }: { params: { id: string }; searchParams: { notice?: string; error?: string } }) {
  const user = await requireUser("property.read");
  const [property, categories, locations, amenities, settings] = await Promise.all([
    db.property.findUnique({
      where: { id: params.id },
      include: {
        amenities: { select: { id: true } },
        media: { orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] },
        _count: { select: { enquiries: true } },
      },
    }),
    db.propertyCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.location.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.amenity.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getSettings(),
  ]);
  if (!property) notFound();

  const canWrite = can(user.role, "property.write");
  const canPublish = can(user.role, "property.publish");
  const canDelete = can(user.role, "property.delete");
  const publishable = (PUBLIC_STATUSES as readonly string[]).includes(property.status);

  return (
    <>
      <PageHeader
        title={property.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {property.reference} · <ListingStatusPill status={property.status} published={property.isPublished} />
            <span>· {property._count.enquiries} enquiries · {property.viewCount} views</span>
          </span>
        }
        back={{ href: "/admin/properties", label: "Properties" }}
        actions={
          <>
            <Link href={`/admin/properties/${property.id}/preview`} className="btn-outline btn-sm" target="_blank">Preview</Link>
            {property.isPublished ? (
              <Link href={`/properties/${property.slug}`} className="btn-outline btn-sm" target="_blank">View live ↗</Link>
            ) : null}
          </>
        }
      />
      <Notice code={searchParams.notice} />
      {searchParams.error === "status" ? (
        <div role="alert" className="mb-6 rounded border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          Set the status to Available, Under offer, Reserved, Sold or Let (and save) before publishing.
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {canWrite ? (
            <EntityForm
              action={saveProperty.bind(null, property.id)}
              sections={propertySections({ categories, locations, amenities, defaultCurrency: settings.currency })}
              values={propertyValues(property, settings.currency)}
              submitLabel="Save changes"
            />
          ) : (
            <Card title="Details">
              <p className="whitespace-pre-line text-sm text-charcoal-700">{property.description}</p>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card title="Visibility">
            <p className="text-sm text-charcoal-700">
              {property.isPublished ? "This listing is live on the website." : "This listing is hidden from the public."}
            </p>
            {property.publishedAt ? <p className="mt-1 text-xs text-charcoal-500">First published {formatDate(property.publishedAt)}</p> : null}
            <p className="mt-1 text-xs text-charcoal-500">Last reviewed: {property.lastReviewedAt ? formatDate(property.lastReviewedAt) : "never"}</p>
            {canPublish ? (
              <form action={setPublished} className="mt-4">
                <input type="hidden" name="id" value={property.id} />
                <input type="hidden" name="publish" value={property.isPublished ? "0" : "1"} />
                {property.isPublished ? (
                  <ActionButton className="btn-outline w-full">Unpublish</ActionButton>
                ) : (
                  <ActionButton className="btn-primary w-full">{publishable ? "Publish" : "Publish (set status first)"}</ActionButton>
                )}
              </form>
            ) : null}
          </Card>

          <Card title="Media">
            <MediaManager
              propertyId={property.id}
              canWrite={canWrite}
              storageReady={isStorageConfigured()}
              media={property.media.map((m) => ({ id: m.id, kind: m.kind, url: m.url, alt: m.alt }))}
            />
          </Card>

          {canWrite ? (
            <Card title="Remove">
              <div className="space-y-3">
                {property.status !== "ARCHIVED" ? (
                  <form action={archiveProperty}>
                    <input type="hidden" name="id" value={property.id} />
                    <ConfirmSubmit label="Archive listing" confirmLabel="Archive" message="Unpublishes and archives this listing." danger={false} className="btn-outline btn-sm w-full" />
                  </form>
                ) : null}
                {canDelete ? (
                  <form action={deleteProperty}>
                    <input type="hidden" name="id" value={property.id} />
                    <ConfirmSubmit label="Delete permanently" confirmLabel="Delete" message="Deletes the listing and its media." className="btn-outline btn-sm w-full text-danger" />
                  </form>
                ) : null}
              </div>
            </Card>
          ) : null}
        </aside>
      </div>
    </>
  );
}
