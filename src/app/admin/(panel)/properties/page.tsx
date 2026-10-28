import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { EmptyRow, ListingStatusPill, Notice, PageHeader, Table, td, th } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";
import { requireUser } from "@/lib/auth";
import { LISTING_STATUSES, STATUS_LABELS, TRANSACTION_LABELS, type ListingStatusValue } from "@/lib/constants";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Properties" };

const PER_PAGE = 25;

type Search = { q?: string; status?: string; published?: string; page?: string; notice?: string };

export default async function AdminPropertiesPage({ searchParams }: { searchParams: Search }) {
  const user = await requireUser("property.read");
  const q = (searchParams.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const status = searchParams.status;

  const where: Prisma.PropertyWhereInput = {
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { reference: { contains: q, mode: "insensitive" } },
            { location: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(status === "closed"
      ? { status: { in: ["SOLD", "RENTED", "WITHDRAWN", "ARCHIVED"] as ListingStatusValue[] } }
      : status && (LISTING_STATUSES as readonly string[]).includes(status)
        ? { status: status as ListingStatusValue }
        : {}),
    ...(searchParams.published === "yes" ? { isPublished: true } : searchParams.published === "no" ? { isPublished: false } : {}),
  };

  const [total, properties] = await Promise.all([
    db.property.count({ where }),
    db.property.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        title: true,
        reference: true,
        status: true,
        isPublished: true,
        isFeatured: true,
        transactionType: true,
        price: true,
        priceOnRequest: true,
        pricePeriod: true,
        currency: true,
        updatedAt: true,
        lastReviewedAt: true,
        location: { select: { name: true } },
        media: { where: { kind: "IMAGE" }, orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        _count: { select: { enquiries: true } },
      },
    }),
  ]);

  const qs = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (searchParams.published) params.set("published", searchParams.published);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/admin/properties${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Properties"
        description={`${total} ${total === 1 ? "listing" : "listings"}`}
        actions={can(user.role, "property.write") ? <Link href="/admin/properties/new" className="btn-primary">Add property</Link> : null}
      />
      <Notice code={searchParams.notice} />

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3" role="search">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="q" className="field-label">Search</label>
          <input id="q" name="q" defaultValue={q} placeholder="Title, reference or location" className="field" />
        </div>
        <div>
          <label htmlFor="status" className="field-label">Status</label>
          <select id="status" name="status" defaultValue={status ?? ""} className="field">
            <option value="">All statuses</option>
            {LISTING_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
            <option value="closed">Sold / let / off-market</option>
          </select>
        </div>
        <div>
          <label htmlFor="published" className="field-label">Visibility</label>
          <select id="published" name="published" defaultValue={searchParams.published ?? ""} className="field">
            <option value="">All</option>
            <option value="yes">Live on website</option>
            <option value="no">Hidden</option>
          </select>
        </div>
        <button type="submit" className="btn-outline">Filter</button>
      </form>

      <Table
        head={
          <tr>
            <th scope="col" className={th}>Property</th>
            <th scope="col" className={th}>Price</th>
            <th scope="col" className={th}>Status</th>
            <th scope="col" className={th}>Enquiries</th>
            <th scope="col" className={th}>Updated</th>
          </tr>
        }
      >
        {properties.length ? (
          properties.map((p) => (
            <tr key={p.id} className="hover:bg-ivory-50">
              <td className={td}>
                <div className="flex gap-3">
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-sm bg-ivory-200">
                    {p.media[0] ? <Image src={p.media[0].url} alt="" fill sizes="64px" className="object-cover" /> : null}
                  </div>
                  <div>
                    <Link href={`/admin/properties/${p.id}`} className="font-medium text-navy-900 hover:underline">{p.title}</Link>
                    <p className="text-xs text-charcoal-500">
                      {p.reference} · {TRANSACTION_LABELS[p.transactionType]} · {p.location.name}
                      {p.isFeatured ? " · Featured" : ""}
                    </p>
                  </div>
                </div>
              </td>
              <td className={td}>{formatPrice(p)}</td>
              <td className={td}><ListingStatusPill status={p.status} published={p.isPublished} /></td>
              <td className={td}>{p._count.enquiries}</td>
              <td className={td}>
                {formatDate(p.updatedAt)}
                <p className="text-xs text-charcoal-500">Reviewed: {p.lastReviewedAt ? formatDate(p.lastReviewedAt) : "never"}</p>
              </td>
            </tr>
          ))
        ) : (
          <EmptyRow colSpan={5}>
            {q || status || searchParams.published ? "No listings match these filters." : "No properties yet. Add your first listing to get started."}
          </EmptyRow>
        )}
      </Table>
      <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} hrefFor={qs} />
    </>
  );
}
