import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyRow, Notice, PageHeader, Table, td, th } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { CONTENT_KINDS } from "./config";

export function generateMetadata({ params }: { params: { kind: string } }): Metadata {
  return { title: CONTENT_KINDS[params.kind]?.title ?? "Content" };
}

export default async function ContentListPage({ params, searchParams }: { params: { kind: string }; searchParams: { notice?: string } }) {
  await requireUser("content.write");
  const config = CONTENT_KINDS[params.kind];
  if (!config) notFound();
  const rows = await config.list();

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.intro}
        back={{ href: "/admin/content", label: "Content" }}
        actions={<Link href={`/admin/content/${params.kind}/new`} className="btn-primary">Add {config.singular}</Link>}
      />
      <Notice code={searchParams.notice} />
      <Table
        head={
          <tr>
            <th scope="col" className={th}>Title</th>
            <th scope="col" className={th}>Visibility</th>
            <th scope="col" className={th}><span className="sr-only">Actions</span></th>
          </tr>
        }
      >
        {rows.length ? (
          rows.map((r) => (
            <tr key={r.id} className="hover:bg-ivory-50">
              <td className={td}>
                <Link href={`/admin/content/${params.kind}/${r.id}`} className="font-medium text-navy-900 hover:underline">{r.title}</Link>
                <p className="text-xs text-charcoal-500">{r.meta}</p>
              </td>
              <td className={td}>
                <span className={cn("badge", r.published ? "bg-success/10 text-success" : "bg-ivory-200 text-charcoal-700")}>
                  {r.published ? "Published" : "Hidden"}
                </span>
              </td>
              <td className={cn(td, "text-right")}>
                {r.href ? <Link href={r.href} target="_blank" className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-900 hover:underline">View ↗</Link> : null}
              </td>
            </tr>
          ))
        ) : (
          <EmptyRow colSpan={3}>Nothing here yet.</EmptyRow>
        )}
      </Table>
    </>
  );
}
