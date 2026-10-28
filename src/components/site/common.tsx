import Link from "next/link";
import { textBlocks, cn, absoluteUrl } from "@/lib/utils";
import type { StockImage } from "@/lib/placeholder-images";
import { StockBackdrop } from "./StockPhoto";

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  // JSON.stringify output is safe in a script tag once "<" is escaped.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function Breadcrumbs({ items, tone = "dark" }: { items: { label: string; href?: string }[]; tone?: "dark" | "light" }) {
  const all = [{ label: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-xs uppercase tracking-[0.14em]", tone === "light" ? "text-ivory-100/70" : "text-charcoal-500")}>
          {all.map((item, i) => (
            <li key={`${item.label}-${i}`} className="flex items-center gap-2">
              {i > 0 ? <span aria-hidden="true" className="text-champagne-500">/</span> : null}
              {item.href && i < all.length - 1 ? (
                <Link href={item.href} className={tone === "light" ? "hover:text-ivory-50" : "hover:text-navy-900"}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={i === all.length - 1 ? "page" : undefined} className={tone === "light" ? "text-ivory-50" : "text-navy-900"}>
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.label,
            ...(item.href ? { item: absoluteUrl(item.href) } : {}),
          })),
        }}
      />
    </>
  );
}

/** Renders admin-authored long text as safe React nodes. */
export function RichText({ text, className }: { text: string | null | undefined; className?: string }) {
  const blocks = textBlocks(text);
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: string) => {
    if (list.length) {
      out.push(
        <ul key={key}>
          {list.map((li, i) => (
            <li key={i}>{li}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  blocks.forEach((b, i) => {
    if (b.kind === "li") {
      list.push(b.text);
      return;
    }
    flush(`ul-${i}`);
    if (b.kind === "h2") out.push(<h2 key={i}>{b.text}</h2>);
    else if (b.kind === "h3") out.push(<h3 key={i}>{b.text}</h3>);
    else out.push(<p key={i}>{b.text}</p>);
  });
  flush("ul-end");
  return <div className={cn("prose-estate", className)}>{out}</div>;
}

/** Shows admin text, or a clearly marked placeholder when the field is empty. */
export function Editable({ value, placeholder }: { value: string | null | undefined; placeholder: string }) {
  if (value && value.trim()) return <>{value}</>;
  return <span className="placeholder-text">{placeholder}</span>;
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  tone = "dark",
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-10 flex flex-col gap-6 md:mb-14", align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between")}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? <p className={tone === "light" ? "eyebrow-light" : "eyebrow"}>{eyebrow}</p> : null}
        <h2 className={cn("mt-3 text-display-lg", tone === "light" && "text-ivory-50")}>{title}</h2>
        {intro ? (
          <p className={cn("mt-4 text-[1.05rem] leading-relaxed", tone === "light" ? "text-ivory-100/75" : "text-charcoal-500")}>{intro}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
  breadcrumbs,
  image,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  breadcrumbs: { label: string; href?: string }[];
  /** Optional placeholder photograph behind the header (falls back to the navy grid). */
  image?: StockImage;
}) {
  return (
    <section className={cn("relative isolate overflow-hidden text-ivory-50", image ? "bg-navy-950" : "bg-architectural")}>
      {image ? <StockBackdrop image={image} overlay="side" /> : null}
      <div className={cn("container", image ? "py-16 md:py-28" : "py-14 md:py-20")}>
        <Breadcrumbs items={breadcrumbs} tone="light" />
        <div className="mt-8 max-w-3xl">
          {eyebrow ? <p className="eyebrow-light">{eyebrow}</p> : null}
          <h1 className="mt-3 text-display-lg text-ivory-50">{title}</h1>
          {intro ? <p className="mt-5 text-lg leading-relaxed text-ivory-100/75">{intro}</p> : null}
        </div>
      </div>
    </section>
  );
}
