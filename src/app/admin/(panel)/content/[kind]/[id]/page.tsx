import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteContent } from "@/app/admin/actions/content";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { EntityForm } from "@/components/admin/EntityForm";
import { PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { CONTENT_KINDS } from "../config";

export function generateMetadata({ params }: { params: { kind: string; id: string } }): Metadata {
  const c = CONTENT_KINDS[params.kind];
  return { title: c ? `${params.id === "new" ? "Add" : "Edit"} ${c.singular}` : "Content" };
}

export default async function ContentEditPage({ params }: { params: { kind: string; id: string } }) {
  await requireUser("content.write");
  const config = CONTENT_KINDS[params.kind];
  if (!config) notFound();
  const isNew = params.id === "new";
  const values = isNew ? config.defaults : await config.load(params.id);
  if (!values) notFound();

  return (
    <>
      <PageHeader
        title={isNew ? `Add ${config.singular}` : `Edit ${config.singular}`}
        back={{ href: `/admin/content/${params.kind}`, label: config.title }}
        actions={
          isNew ? null : (
            <form action={deleteContent}>
              <input type="hidden" name="kind" value={config.deleteKind} />
              <input type="hidden" name="id" value={params.id} />
              <ConfirmSubmit label={`Delete ${config.singular}`} confirmLabel="Delete" className="btn-outline btn-sm text-danger" />
            </form>
          )
        }
      />
      <EntityForm
        action={config.action.bind(null, isNew ? null : params.id)}
        sections={config.sections}
        values={values}
        submitLabel={isNew ? `Create ${config.singular}` : "Save changes"}
      />
    </>
  );
}
