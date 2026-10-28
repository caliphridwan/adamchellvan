import Link from "next/link";
import type { Metadata } from "next";
import { EmptyRow, EnquiryStatusPill, Notice, PageHeader, Table, td, th } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";
import { requireUser } from "@/lib/auth";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS, ENQUIRY_TYPES, ENQUIRY_TYPE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { buildEnquiryWhere, type EnquirySearch } from "@/lib/enquiry-filters";
import { can } from "@/lib/permissions";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Enquiries" };

const PER_PAGE = 30;

export default async function EnquiriesPage({ searchParams }: { searchParams: EnquirySearch & { page?: string; notice?: string } }) {
  const user = await requireUser("enquiry.read");
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const where = buildEnquiryWhere(searchParams, user);
  const [total, enquiries] = await Promise.all([
    db.enquiry.count({ where }),
    db.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        type: true,
        status: true,
        createdAt: true,
        followUpAt: true,
        property: { select: { reference: true, title: true } },
        assignedTo: { select: { name: true } },
      },
    }),
  ]);

  const filterParams = new URLSearchParams();
  for (const k of ["q", "status", "type", "assigned", "from", "to"] as const) {
    const v = searchParams[k];
    if (v) filterParams.set(k, v);
  }
  const hrefFor = (p: number) => {
    const params = new URLSearchParams(filterParams);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/admin/enquiries${s ? `?${s}` : ""}`;
  };
  const exportHref = `/admin/enquiries/export${filterParams.toString() ? `?${filterParams}` : ""}`;
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Enquiries"
        description={can(user.role, "enquiry.readAll") ? `${total} matching` : `${total} assigned to you`}
        actions={can(user.role, "enquiry.export") ? <a href={exportHref} className="btn-outline">Export CSV</a> : null}
      />
      <Notice code={searchParams.notice} />

      <form method="get" className="mb-6 grid gap-3 md:grid-cols-3 lg:grid-cols-7 lg:items-end" role="search">
        <div className="md:col-span-3 lg:col-span-2">
          <label htmlFor="q" className="field-label">Search</label>
          <input id="q" name="q" defaultValue={searchParams.q ?? ""} placeholder="Name, email, phone or reference" className="field" />
        </div>
        <div>
          <label htmlFor="status" className="field-label">Status</label>
          <select id="status" name="status" defaultValue={searchParams.status ?? ""} className="field">
            <option value="">All (excl. spam)</option>
            <option value="open">Open</option>
            {ENQUIRY_STATUSES.map((s) => <option key={s} value={s}>{ENQUIRY_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="type" className="field-label">Type</label>
          <select id="type" name="type" defaultValue={searchParams.type ?? ""} className="field">
            <option value="">All types</option>
            {ENQUIRY_TYPES.map((t) => <option key={t} value={t}>{ENQUIRY_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        {can(user.role, "enquiry.readAll") ? (
          <div>
            <label htmlFor="assigned" className="field-label">Assigned</label>
            <select id="assigned" name="assigned" defaultValue={searchParams.assigned ?? ""} className="field">
              <option value="">Anyone</option>
              <option value="me">Me</option>
              <option value="none">Unassigned</option>
            </select>
          </div>
        ) : null}
        <div>
          <label htmlFor="from" className="field-label">From</label>
          <input id="from" name="from" type="date" defaultValue={searchParams.from ?? ""} className="field" />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="to" className="field-label">To</label>
            <input id="to" name="to" type="date" defaultValue={searchParams.to ?? ""} className="field" />
          </div>
        </div>
        <div className="flex gap-2 md:col-span-3 lg:col-span-7">
          <button type="submit" className="btn-outline">Filter</button>
          <Link href="/admin/enquiries" className="btn-ghost">Reset</Link>
        </div>
      </form>

      <Table
        head={
          <tr>
            <th scope="col" className={th}>Contact</th>
            <th scope="col" className={th}>Type</th>
            <th scope="col" className={th}>Property</th>
            <th scope="col" className={th}>Status</th>
            <th scope="col" className={th}>Assigned</th>
            <th scope="col" className={th}>Received</th>
          </tr>
        }
      >
        {enquiries.length ? (
          enquiries.map((e) => (
            <tr key={e.id} className={cn("hover:bg-ivory-50", e.status === "NEW" && "bg-champagne-300/10")}>
              <td className={td}>
                <Link href={`/admin/enquiries/${e.id}`} className="font-medium text-navy-900 hover:underline">{e.name}</Link>
                <p className="text-xs text-charcoal-500">{e.email}{e.phone ? ` · ${e.phone}` : ""}</p>
              </td>
              <td className={td}>{ENQUIRY_TYPE_LABELS[e.type]}</td>
              <td className={td}>{e.property ? <span title={e.property.title}>{e.property.reference}</span> : "—"}</td>
              <td className={td}>
                <EnquiryStatusPill status={e.status} />
                {e.followUpAt ? (
                  <p className={cn("mt-1 text-xs", e.followUpAt < now ? "font-semibold text-danger" : "text-charcoal-500")}>
                    Follow up {formatDate(e.followUpAt)}
                  </p>
                ) : null}
              </td>
              <td className={td}>{e.assignedTo?.name ?? <span className="text-charcoal-500">—</span>}</td>
              <td className={td}>{formatDate(e.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
            </tr>
          ))
        ) : (
          <EmptyRow colSpan={6}>No enquiries match these filters.</EmptyRow>
        )}
      </Table>
      <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} hrefFor={hrefFor} />
    </>
  );
}
