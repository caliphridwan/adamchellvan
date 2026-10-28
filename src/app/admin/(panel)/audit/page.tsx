import type { Metadata } from "next";
import { EmptyRow, PageHeader, Table, td, th } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit log" };

const PER_PAGE = 50;

export default async function AuditPage({ searchParams }: { searchParams: { entity?: string; page?: string } }) {
  await requireUser("audit.read");
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const entity = searchParams.entity && /^[A-Za-z]{1,40}$/.test(searchParams.entity) ? searchParams.entity : undefined;
  const where = entity ? { entity } : {};
  const [total, logs, entities] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { user: { select: { name: true } } },
    }),
    db.auditLog.findMany({ distinct: ["entity"], select: { entity: true }, orderBy: { entity: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Audit log" description="A record of important administrative actions. Personal data is not copied here." />
      <form method="get" className="mb-6 flex items-end gap-3">
        <div>
          <label htmlFor="entity" className="field-label">Area</label>
          <select id="entity" name="entity" defaultValue={entity ?? ""} className="field">
            <option value="">All</option>
            {entities.map((e) => <option key={e.entity} value={e.entity}>{e.entity}</option>)}
          </select>
        </div>
        <button type="submit" className="btn-outline">Filter</button>
      </form>
      <Table
        head={
          <tr>
            <th scope="col" className={th}>When</th>
            <th scope="col" className={th}>Who</th>
            <th scope="col" className={th}>Action</th>
            <th scope="col" className={th}>Details</th>
          </tr>
        }
      >
        {logs.length ? (
          logs.map((l) => (
            <tr key={l.id}>
              <td className={td}>{formatDate(l.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
              <td className={td}>{l.user?.name ?? "—"}</td>
              <td className={td}><code className="text-xs">{l.action}</code></td>
              <td className={td}>
                {l.summary ?? ""}
                {l.entityId ? <span className="block text-xs text-charcoal-500">{l.entity} {l.entityId}</span> : null}
              </td>
            </tr>
          ))
        ) : (
          <EmptyRow colSpan={4}>No activity recorded yet.</EmptyRow>
        )}
      </Table>
      <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} hrefFor={(p) => `/admin/audit?${new URLSearchParams({ ...(entity ? { entity } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`} />
    </>
  );
}
