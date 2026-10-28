import Link from "next/link";
import type { Metadata } from "next";
import { Card, EnquiryStatusPill, ListingStatusPill, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { ENQUIRY_TYPE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email";
import { can } from "@/lib/permissions";
import { getSettings, missingSettings } from "@/lib/settings";
import { isCloudinaryConfigured } from "@/lib/upload";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const RANGES = { "7": 7, "30": 30, "90": 90 } as const;

export default async function DashboardPage({ searchParams }: { searchParams: { range?: string; denied?: string } }) {
  const user = await requireUser("dashboard.view");
  const rangeKey = (searchParams.range && searchParams.range in RANGES ? searchParams.range : "30") as keyof typeof RANGES;
  const days = RANGES[rangeKey];
  // Day buckets are UTC (matches date_trunc on a UTC database session).
  const since = new Date(Date.now() - (days - 1) * 86_400_000);
  since.setUTCHours(0, 0, 0, 0);
  const enquiryScope = can(user.role, "enquiry.readAll") ? {} : { assignedToId: user.id };

  const [
    totalProperties,
    publishedCount,
    draftCount,
    unavailableCount,
    newEnquiries,
    openViewings,
    recentlyUpdated,
    latestEnquiries,
    followUps,
    topViewed,
    trendRows,
    settings,
    staleListings,
  ] = await Promise.all([
    db.property.count(),
    db.property.count({ where: { isPublished: true } }),
    db.property.count({ where: { status: "DRAFT" } }),
    db.property.count({ where: { status: { in: ["SOLD", "RENTED", "WITHDRAWN", "ARCHIVED"] } } }),
    db.enquiry.count({ where: { ...enquiryScope, status: "NEW" } }),
    db.enquiry.count({ where: { ...enquiryScope, type: "VIEWING", status: { in: ["NEW", "CONTACTED", "QUALIFIED"] } } }),
    db.property.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, reference: true, status: true, isPublished: true, updatedAt: true },
    }),
    db.enquiry.findMany({
      where: enquiryScope,
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, type: true, status: true, createdAt: true, property: { select: { reference: true } } },
    }),
    db.enquiry.findMany({
      where: { ...enquiryScope, followUpAt: { lte: new Date(Date.now() + 86_400_000) }, status: { notIn: ["CLOSED_WON", "CLOSED_LOST", "SPAM"] } },
      orderBy: { followUpAt: "asc" },
      take: 6,
      select: { id: true, name: true, followUpAt: true },
    }),
    db.property.findMany({
      where: { isPublished: true, viewCount: { gt: 0 } },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { id: true, title: true, viewCount: true, _count: { select: { enquiries: true } } },
    }),
    // Parameterised raw query (tagged template) — values are bound, never interpolated.
    can(user.role, "enquiry.readAll")
      ? db.$queryRaw<{ day: Date; count: number }[]>`
          SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
          FROM "Enquiry"
          WHERE "createdAt" >= ${since} AND "status" <> 'SPAM'
          GROUP BY 1 ORDER BY 1`
      : db.$queryRaw<{ day: Date; count: number }[]>`
          SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
          FROM "Enquiry"
          WHERE "createdAt" >= ${since} AND "status" <> 'SPAM' AND "assignedToId" = ${user.id}
          GROUP BY 1 ORDER BY 1`,
    getSettings(),
    // Published listings not reviewed in 30 days — the brief requires never implying unavailable property is available.
    db.property.findMany({
      where: {
        isPublished: true,
        status: { in: ["AVAILABLE", "UNDER_OFFER", "RESERVED"] },
        OR: [{ lastReviewedAt: null }, { lastReviewedAt: { lt: new Date(Date.now() - 30 * 86_400_000) } }],
      },
      orderBy: { lastReviewedAt: { sort: "asc", nulls: "first" } },
      take: 8,
      select: { id: true, title: true, reference: true, lastReviewedAt: true },
    }),
  ]);

  // Fill every day in the range so gaps show as zero.
  const byDay = new Map<string, number>(trendRows.map((r) => [new Date(r.day).toISOString().slice(0, 10), Number(r.count)] as [string, number]));
  const series: { day: string; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    series.push({ day: key, count: byDay.get(key) ?? 0 });
  }
  const periodTotal = series.reduce((a, b) => a + b.count, 0);
  const max = Math.max(1, ...series.map((s) => s.count));
  const missing = missingSettings(settings);
  const setupWarnings = [
    !isCloudinaryConfigured() ? "Photos are being stored in your database (works fine to start). For a large photo library, add Cloudinary — see README." : null,
    !isEmailConfigured() ? "Email delivery (Resend) is not configured — enquiry notifications are not being sent." : null,
  ].filter(Boolean) as string[];

  const metrics = [
    { label: "Total properties", value: totalProperties, href: "/admin/properties" },
    { label: "Published", value: publishedCount, href: "/admin/properties?published=yes" },
    { label: "Drafts", value: draftCount, href: "/admin/properties?status=DRAFT" },
    { label: "Sold / let / off-market", value: unavailableCount, href: "/admin/properties?status=closed" },
    { label: "New enquiries", value: newEnquiries, href: "/admin/enquiries?status=NEW", highlight: newEnquiries > 0 },
    { label: "Open inspection requests", value: openViewings, href: "/admin/enquiries?type=VIEWING" },
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(" ")[0]}`} description="Live figures from your database." />

      {searchParams.denied ? (
        <div role="alert" className="mb-6 rounded border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          You don't have permission to open that page.
        </div>
      ) : null}

      {can(user.role, "settings.write") && (missing.length || setupWarnings.length) ? (
        <div className="mb-8 rounded-md border border-champagne-400/60 bg-champagne-300/15 p-5 text-sm">
          <p className="font-semibold text-navy-900">Before launch</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-charcoal-700">
            {missing.length ? (
              <li>
                Complete these site details: {missing.join(", ")}.{" "}
                <Link href="/admin/content/settings" className="font-semibold underline">Edit site settings</Link>
              </li>
            ) : null}
            {setupWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {staleListings.length && can(user.role, "property.write") ? (
        <div role="alert" className="mb-8 rounded-md border border-danger/30 bg-danger/5 p-5 text-sm">
          <p className="font-semibold text-danger">Listings to re-confirm ({staleListings.length}{staleListings.length === 8 ? "+" : ""})</p>
          <p className="mt-1 text-charcoal-700">
            These live listings haven't been reviewed in 30 days. Confirm availability and price, tick “I have reviewed this listing” and save — or
            update the status if they are no longer available.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {staleListings.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/properties/${p.id}`} className="inline-block rounded border border-ivory-300 bg-white px-3 py-1.5 text-xs hover:border-navy-900">
                  {p.reference} · {p.title} · {p.lastReviewedAt ? `reviewed ${formatDate(p.lastReviewedAt)}` : "never reviewed"}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map((m) => (
          <li key={m.label}>
            <Link
              href={m.href}
              className={cn(
                "block h-full rounded-md border bg-white p-5 transition-shadow hover:shadow-card",
                m.highlight ? "border-champagne-400" : "border-ivory-200",
              )}
            >
              <p className="font-display text-4xl font-semibold text-navy-900">{m.value.toLocaleString("en")}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-charcoal-500">{m.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Enquiry trend"
          action={
            <div className="flex gap-1" role="group" aria-label="Period">
              {Object.keys(RANGES).map((r) => (
                <Link
                  key={r}
                  href={`/admin?range=${r}`}
                  aria-current={r === rangeKey ? "true" : undefined}
                  className={cn("rounded px-2.5 py-1 text-xs font-semibold", r === rangeKey ? "bg-navy-900 text-ivory-50" : "text-charcoal-700 hover:bg-ivory-200")}
                >
                  {r}d
                </Link>
              ))}
            </div>
          }
        >
          <p className="text-sm text-charcoal-500">
            <span className="font-semibold text-navy-900">{periodTotal}</span> enquiries in the last {days} days (excluding spam)
          </p>
          <div
            className="mt-5 flex h-40 items-end gap-[2px]"
            role="img"
            aria-label={`Daily enquiries over the last ${days} days. Total ${periodTotal}. Peak ${max === 1 && periodTotal === 0 ? 0 : max} in a day.`}
          >
            {series.map((s) => (
              <div key={s.day} className="group relative flex-1">
                <div
                  className={cn("w-full rounded-t-sm", s.count ? "bg-navy-700" : "bg-ivory-200")}
                  style={{ height: `${s.count ? Math.max(6, (s.count / max) * 160) : 3}px` }}
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-navy-950 px-2 py-1 text-[0.65rem] text-ivory-50 group-hover:block">
                  {formatDate(s.day, { day: "numeric", month: "short" })}: {s.count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[0.65rem] uppercase tracking-[0.12em] text-charcoal-500">
            <span>{formatDate(series[0]?.day, { day: "numeric", month: "short" })}</span>
            <span>Today</span>
          </div>
        </Card>

        <Card title="Follow-ups due">
          {followUps.length ? (
            <ul className="divide-y divide-ivory-200 text-sm">
              {followUps.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/admin/enquiries/${f.id}`} className="font-medium text-navy-900 hover:underline">{f.name}</Link>
                  <span className={cn("text-xs", f.followUpAt && f.followUpAt < new Date() ? "font-semibold text-danger" : "text-charcoal-500")}>
                    {formatDate(f.followUpAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-500">Nothing due today.</p>
          )}
        </Card>

        <Card className="lg:col-span-2" title="Latest enquiries" action={<Link href="/admin/enquiries" className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-900 hover:underline">View all</Link>}>
          {latestEnquiries.length ? (
            <ul className="divide-y divide-ivory-200 text-sm">
              {latestEnquiries.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/admin/enquiries/${e.id}`} className="font-medium text-navy-900 hover:underline">{e.name}</Link>
                    <p className="text-xs text-charcoal-500">
                      {ENQUIRY_TYPE_LABELS[e.type]}
                      {e.property ? ` · ${e.property.reference}` : ""} · {formatDate(e.createdAt)}
                    </p>
                  </div>
                  <EnquiryStatusPill status={e.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-500">No enquiries yet.</p>
          )}
        </Card>

        <Card title="Most viewed listings">
          {topViewed.length ? (
            <ul className="divide-y divide-ivory-200 text-sm">
              {topViewed.map((p) => (
                <li key={p.id} className="py-2.5">
                  <Link href={`/admin/properties/${p.id}`} className="font-medium text-navy-900 hover:underline">{p.title}</Link>
                  <p className="text-xs text-charcoal-500">
                    {p.viewCount.toLocaleString("en")} views · {p._count.enquiries} enquiries
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-500">No views recorded yet.</p>
          )}
        </Card>

        <Card className="lg:col-span-3" title="Recently updated listings">
          {recentlyUpdated.length ? (
            <ul className="divide-y divide-ivory-200 text-sm">
              {recentlyUpdated.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/admin/properties/${p.id}`} className="font-medium text-navy-900 hover:underline">{p.title}</Link>
                    <p className="text-xs text-charcoal-500">{p.reference} · updated {formatDate(p.updatedAt)}</p>
                  </div>
                  <ListingStatusPill status={p.status} published={p.isPublished} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-500">
              No properties yet.{" "}
              {can(user.role, "property.write") ? (
                <Link href="/admin/properties/new" className="font-semibold underline">Add your first listing</Link>
              ) : null}
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
