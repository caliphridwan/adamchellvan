import Link from "next/link";
import { ENQUIRY_STATUS_LABELS, STATUS_LABELS, type EnquiryStatusValue, type ListingStatusValue } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {back ? (
          <Link href={back.href} className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.14em] text-charcoal-500 hover:text-navy-900">
            ← {back.label}
          </Link>
        ) : null}
        <h1 className="text-4xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-charcoal-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

const NOTICES: Record<string, string> = {
  saved: "Changes saved.",
  created: "Created successfully.",
  deleted: "Deleted.",
  published: "Listing published.",
  unpublished: "Listing unpublished.",
  archived: "Listing archived.",
};

export function Notice({ code }: { code?: string }) {
  if (!code || !NOTICES[code]) return null;
  return (
    <div role="status" className="mb-6 rounded border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
      {NOTICES[code]}
    </div>
  );
}

export function ListingStatusPill({ status, published }: { status: ListingStatusValue; published?: boolean }) {
  const tone: Record<ListingStatusValue, string> = {
    DRAFT: "bg-ivory-200 text-charcoal-700",
    AVAILABLE: "bg-success/10 text-success",
    UNDER_OFFER: "bg-champagne-300/40 text-champagne-700",
    RESERVED: "bg-champagne-300/40 text-champagne-700",
    SOLD: "bg-navy-900 text-ivory-50",
    RENTED: "bg-navy-900 text-ivory-50",
    WITHDRAWN: "bg-danger/10 text-danger",
    ARCHIVED: "bg-ivory-300 text-charcoal-700",
  };
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      <span className={cn("badge", tone[status])}>{STATUS_LABELS[status]}</span>
      {published !== undefined ? (
        <span className={cn("badge", published ? "bg-navy-700 text-ivory-50" : "border border-ivory-300 text-charcoal-500")}>
          {published ? "Live" : "Hidden"}
        </span>
      ) : null}
    </span>
  );
}

export function EnquiryStatusPill({ status }: { status: EnquiryStatusValue }) {
  const tone: Record<EnquiryStatusValue, string> = {
    NEW: "bg-champagne-400 text-navy-950",
    CONTACTED: "bg-navy-700/10 text-navy-700",
    QUALIFIED: "bg-navy-700/10 text-navy-700",
    VIEWING_SCHEDULED: "bg-success/10 text-success",
    CLOSED_WON: "bg-success text-white",
    CLOSED_LOST: "bg-ivory-300 text-charcoal-700",
    SPAM: "bg-danger/10 text-danger",
  };
  return <span className={cn("badge", tone[status])}>{ENQUIRY_STATUS_LABELS[status]}</span>;
}

export function Card({ children, className, title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("rounded-md border border-ivory-200 bg-white p-6", className)}>
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl text-navy-900">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-charcoal-500">
        {children}
      </td>
    </tr>
  );
}

export const th = "px-4 py-3 text-left text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-charcoal-500";
export const td = "px-4 py-3 align-top text-sm";

export function Table({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-ivory-200 bg-white">
      <table className="w-full min-w-[720px] border-collapse">
        <thead className="border-b border-ivory-200 bg-ivory-50">{head}</thead>
        <tbody className="divide-y divide-ivory-200">{children}</tbody>
      </table>
    </div>
  );
}
