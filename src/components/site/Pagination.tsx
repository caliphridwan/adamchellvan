import Link from "next/link";
import { IconArrowLeft, IconArrowRight } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Accessible numbered pagination. `hrefFor(page)` builds each link. */
export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (p: number) => string }) {
  if (totalPages <= 1) return null;
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="btn-ghost" aria-label="Previous page" rel="prev">
          <IconArrowLeft className="h-4 w-4" />
        </Link>
      ) : null}
      <ul className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-2 text-charcoal-500">…</li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "flex h-11 min-w-[44px] items-center justify-center rounded px-3 text-sm font-semibold",
                  p === page ? "bg-navy-900 text-ivory-50" : "text-navy-900 hover:bg-ivory-200",
                )}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ul>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="btn-ghost" aria-label="Next page" rel="next">
          <IconArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}
