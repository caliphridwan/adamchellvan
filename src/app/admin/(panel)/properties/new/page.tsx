import Link from "next/link";
import type { Metadata } from "next";
import { saveProperty } from "@/app/admin/actions/properties";
import { EntityForm } from "@/components/admin/EntityForm";
import { PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { propertySections, propertyValues } from "../form-config";

export const metadata: Metadata = { title: "Add property" };

export default async function NewPropertyPage() {
  await requireUser("property.write");
  const [categories, locations, amenities, settings] = await Promise.all([
    db.propertyCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.location.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.amenity.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getSettings(),
  ]);

  return (
    <>
      <PageHeader
        title="Add property"
        description="New listings are saved as hidden drafts. Add photos after saving, then publish."
        back={{ href: "/admin/properties", label: "Properties" }}
      />
      {!categories.length || !locations.length ? (
        <div role="alert" className="rounded border border-champagne-400/60 bg-champagne-300/15 px-4 py-3 text-sm">
          Add at least one category and one location first.{" "}
          <Link href="/admin/content/taxonomy" className="font-semibold underline">Manage taxonomy</Link>
        </div>
      ) : (
        <EntityForm
          action={saveProperty.bind(null, null)}
          sections={propertySections({ categories, locations, amenities, defaultCurrency: settings.currency })}
          values={propertyValues(null, settings.currency)}
          submitLabel="Create listing"
        />
      )}
    </>
  );
}
