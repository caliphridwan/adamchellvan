import Link from "next/link";
import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { ENQUIRY_TYPE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Monthly report" };

const QUALIFIED = ["QUALIFIED", "VIEWING_SCHEDULED", "CLOSED_WON"] as const;

function monthRange(key: string) {
  const [y, m] = key.split("-").map(Number) as [number, number];
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  const prevStart = new Date(Date.UTC(y, m - 2, 1));
  return { start, end, prevStart };
}

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function Delta({ now, prev }: { now: number; prev: number }) {
  if (!prev && !now) return null;
  const diff = now - prev;
  return (
    <span className={cn("ml-2 text-xs font-semibold", diff > 0 ? "text-success" : diff < 0 ? "text-danger" : "text-charcoal-500")}>
      {diff > 0 ? "▲" : diff < 0 ? "▼" : "•"} {Math.abs(diff)} vs last month
    </span>
  );
}

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-sm text-charcoal-500">No data for this month.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex justify-between gap-3">
            <span className="truncate text-charcoal-700">{r.label}</span>
            <span className="font-semibold text-navy-900">{r.value}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-ivory-200">
            <div className="h-1.5 rounded-full bg-navy-700" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: { month?: string } }) {
  await requireUser("enquiry.readAll");
  const current = monthKey(new Date());
  const key = searchParams.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(searchParams.month) ? searchParams.month : current;
  const { start, end, prevStart } = monthRange(key);
  const inMonth = { createdAt: { gte: start, lt: end } };
  const inPrev = { createdAt: { gte: prevStart, lt: start } };
  const notSpam = { status: { not: "SPAM" as const } };

  const [
    total,
    prevTotal,
    qualified,
    prevQualified,
    won,
    byType,
    bySource,
    byLanding,
    clicks,
    prevClicks,
    byProperty,
    published,
    live,
  ] = await Promise.all([
    db.enquiry.count({ where: { ...inMonth, ...notSpam } }),
    db.enquiry.count({ where: { ...inPrev, ...notSpam } }),
    db.enquiry.count({ where: { ...inMonth, status: { in: [...QUALIFIED] } } }),
    db.enquiry.count({ where: { ...inPrev, status: { in: [...QUALIFIED] } } }),
    db.enquiry.count({ where: { ...inMonth, status: "CLOSED_WON" } }),
    db.enquiry.groupBy({ by: ["type"], where: { ...inMonth, ...notSpam }, _count: { _all: true } }),
    db.enquiry.groupBy({ by: ["utmSource", "utmMedium"], where: { ...inMonth, ...notSpam }, _count: { _all: true } }),
    db.enquiry.groupBy({ by: ["landingPage"], where: { ...inMonth, ...notSpam }, _count: { _all: true } }),
    db.contactEvent.groupBy({ by: ["kind"], where: inMonth, _count: { _all: true } }),
    db.contactEvent.groupBy({ by: ["kind"], where: inPrev, _count: { _all: true } }),
    db.enquiry.groupBy({ by: ["propertyId"], where: { ...inMonth, ...notSpam, propertyId: { not: null } }, _count: { _all: true } }),
    db.property.count({ where: { publishedAt: { gte: start, lt: end } } }),
    db.property.count({ where: { isPublished: true, status: { in: ["AVAILABLE", "UNDER_OFFER", "RESERVED"] } } }),
  ]);

  const topPropertyIds = byProperty
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 8)
    .map((r) => r.propertyId)
    .filter((x): x is string => Boolean(x));
  const topProperties = topPropertyIds.length
    ? await db.property.findMany({ where: { id: { in: topPropertyIds } }, select: { id: true, title: true, reference: true, viewCount: true } })
    : [];

  const clickCount = (rows: typeof clicks, k: string) => rows.find((r) => r.kind === k)?._count._all ?? 0;
  const sortDesc = (rows: { label: string; value: number }[]) => rows.sort((a, b) => b.value - a.value);

  const typeRows = sortDesc(byType.map((r) => ({ label: ENQUIRY_TYPE_LABELS[r.type], value: r._count._all })));
  const sourceRows = sortDesc(
    bySource.map((r) => ({
      label: r.utmSource ? `${r.utmSource}${r.utmMedium ? ` (${r.utmMedium})` : ""}` : "Direct / unknown",
      value: r._count._all,
    })),
  ).slice(0, 10);
  const landingRows = sortDesc(byLanding.map((r) => ({ label: r.landingPage ?? "Unknown", value: r._count._all }))).slice(0, 8);
  const propertyRows = topPropertyIds.map((id) => {
    const p = topProperties.find((x) => x.id === id);
    return { id, label: p ? `${p.reference} — ${p.title}` : id, value: byProperty.find((r) => r.propertyId === id)?._count._all ?? 0, views: p?.viewCount ?? 0 };
  });

  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - i);
    months.push(monthKey(d));
  }
  const monthLabel = (k: string) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(monthRange(k).start);

  const headline = [
    { label: "Enquiries (excl. spam)", value: total, prev: prevTotal },
    { label: "Qualified leads", value: qualified, prev: prevQualified },
    { label: "Closed — won", value: won },
    { label: "WhatsApp clicks", value: clickCount(clicks, "whatsapp"), prev: clickCount(prevClicks, "whatsapp") },
    { label: "Phone clicks", value: clickCount(clicks, "phone"), prev: clickCount(prevClicks, "phone") },
    { label: "Email clicks", value: clickCount(clicks, "email"), prev: clickCount(prevClicks, "email") },
    { label: "New listings published", value: published },
    { label: "Live listings now", value: live },
  ];

  return (
    <>
      <PageHeader
        title={`Monthly report — ${monthLabel(key)}`}
        description="Figures from your own database. Website visitors and Google search traffic are in Google Analytics 4 and Search Console."
        actions={
          <form method="get" className="flex items-end gap-2">
            <label htmlFor="month" className="sr-only">Month</label>
            <select id="month" name="month" defaultValue={key} className="field min-h-[40px] py-1.5 text-sm">
              {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
            <button type="submit" className="btn-outline btn-sm">Show</button>
          </form>
        }
      />

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {headline.map((h) => (
          <li key={h.label} className="rounded-md border border-ivory-200 bg-white p-5">
            <p className="font-display text-4xl font-semibold text-navy-900">{h.value.toLocaleString("en")}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-charcoal-500">
              {h.label}
              {h.prev !== undefined ? <Delta now={h.value} prev={h.prev} /> : null}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Enquiries by type"><Bars rows={typeRows} /></Card>
        <Card title="Lead sources">
          <Bars rows={sourceRows} />
          <p className="mt-4 text-xs text-charcoal-500">
            Add <code>?utm_source=instagram&amp;utm_medium=social&amp;utm_campaign=…</code> to links you share on social media so leads are attributed precisely.
          </p>
        </Card>
        <Card title="Landing pages that produced leads"><Bars rows={landingRows} /></Card>
        <Card title="Most-enquired listings">
          {propertyRows.length ? (
            <ul className="divide-y divide-ivory-200 text-sm">
              {propertyRows.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-2.5">
                  <Link href={`/admin/properties/${p.id}`} className="truncate text-navy-900 hover:underline">{p.label}</Link>
                  <span className="shrink-0 text-charcoal-500">{p.value} enquiries · {p.views} views (all-time)</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-500">No property-specific enquiries this month.</p>
          )}
        </Card>
      </div>

      <Card className="mt-8" title="How to use this report">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-charcoal-700">
          <li>Compare <strong>qualified leads</strong>, not just total enquiries — that's the measure of whether marketing reaches serious clients.</li>
          <li>Put more effort into the <strong>lead sources</strong> producing qualified leads, and review those that bring volume but few qualified leads.</li>
          <li>Listings with many views but few enquiries may need better photos, a clearer description or a price review.</li>
          <li>If WhatsApp clicks are high but form enquiries low, make sure WhatsApp conversations are logged as enquiries so follow-up is tracked.</li>
          <li>Check Google Search Console monthly for the searches bringing visitors, and Google Analytics 4 for visitor numbers and conversions.</li>
        </ul>
      </Card>
    </>
  );
}
