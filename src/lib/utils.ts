// Pure helpers — no server-only imports so they can be used anywhere and unit-tested.

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Converts a Prisma Decimal / string / number to a JS number (or null). */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(n) ? n : null;
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString("en")}`;
  }
}

export function formatPrice(opts: {
  price: unknown;
  currency: string;
  priceOnRequest?: boolean;
  pricePeriod?: string | null;
}): string {
  const amount = toNumber(opts.price);
  if (opts.priceOnRequest || amount === null) return "Price on request";
  const base = formatMoney(amount, opts.currency);
  return opts.pricePeriod ? `${base} ${opts.pricePeriod}` : base;
}

const AREA_LABELS: Record<string, string> = {
  SQM: "m²",
  SQFT: "sq ft",
  HECTARE: "ha",
  ACRE: "acres",
  PLOT: "plot(s)",
};

export function formatArea(value: unknown, unit?: string | null): string | null {
  const n = toNumber(value);
  if (n === null) return null;
  const label = unit ? AREA_LABELS[unit] ?? unit : "";
  return `${n.toLocaleString("en", { maximumFractionDigits: 2 })} ${label}`.trim();
}

export function formatDate(d: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-GB", opts ?? { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** Splits admin-entered plain text into paragraphs. Content is rendered as text, never HTML. */
export function paragraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export type TextBlock = { kind: "h2" | "h3" | "p" | "li"; text: string };

/**
 * Very small, safe structure parser for long-form admin text (articles, services).
 * Supports "## Heading", "### Subheading" and "- list item" lines. Output is rendered as React text nodes.
 */
export function textBlocks(text: string | null | undefined): TextBlock[] {
  if (!text) return [];
  const blocks: TextBlock[] = [];
  for (const para of text.split(/\n\s*\n/)) {
    const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    if (lines.every((l) => /^[-*]\s+/.test(l))) {
      for (const l of lines) blocks.push({ kind: "li", text: l.replace(/^[-*]\s+/, "") });
      continue;
    }
    const first = lines[0];
    if (first.startsWith("### ")) {
      blocks.push({ kind: "h3", text: first.slice(4) });
      if (lines.length > 1) blocks.push({ kind: "p", text: lines.slice(1).join(" ") });
    } else if (first.startsWith("## ")) {
      blocks.push({ kind: "h2", text: first.slice(3) });
      if (lines.length > 1) blocks.push({ kind: "p", text: lines.slice(1).join(" ") });
    } else {
      blocks.push({ kind: "p", text: lines.join(" ") });
    }
  }
  return blocks;
}

/** Parses "Title: description" lines (values, differentiators). */
export function titledLines(text: string | null | undefined): { title: string; body: string }[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return { title: line, body: "" };
      return { title: line.slice(0, idx).trim(), body: line.slice(idx + 1).trim() };
    });
}

export function digitsOnly(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

export function whatsappLink(number: string | null | undefined, message?: string): string | null {
  const digits = digitsOnly(number);
  if (digits.length < 8) return null;
  const q = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${q}`;
}

export function telLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned.length >= 7 ? `tel:${cleaned}` : null;
}

export function isPlaceholder(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return true;
  return /^\[.*\]$/.test(value.trim());
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}

/** Hosts configured in next.config.mjs `images.remotePatterns`. Other hosts render unoptimised. */
const OPTIMISED_IMAGE_HOSTS = ["res.cloudinary.com", "images.unsplash.com"];

export function isOptimisableImage(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith("/")) return true; // files served by this site (e.g. /media/…, /images/…)
  try {
    const u = new URL(url);
    return u.protocol === "https:" && OPTIMISED_IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

// ─── Indicative currency conversion ───
// Rates are entered by staff in Site settings as "USD=1550" lines, meaning
// 1 USD = 1550 units of the base currency. Output is an estimate only, never a quote.

export function parseFxRates(text: string | null | undefined, base: string): Record<string, number> {
  const rates: Record<string, number> = { [base.toUpperCase()]: 1 };
  for (const line of (text ?? "").split(/\n|;/)) {
    const m = line.trim().match(/^([A-Za-z]{3})\s*[=:]\s*([\d.,]+)$/);
    if (!m) continue;
    const value = Number(m[2]!.replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0) rates[m[1]!.toUpperCase()] = value;
  }
  return rates;
}

/** Converts between two currencies via the base. Returns null when either rate is unknown. */
export function convertCurrency(amount: number, from: string, to: string, rates: Record<string, number>): number | null {
  const f = rates[from.toUpperCase()];
  const t = rates[to.toUpperCase()];
  if (!f || !t) return null;
  return (amount * f) / t;
}

/** Indicative equivalents of a price in every other configured currency. */
export function indicativePrices(amount: number | null, currency: string, rates: Record<string, number>): { currency: string; amount: number }[] {
  if (amount === null || !rates[currency.toUpperCase()]) return [];
  return Object.keys(rates)
    .filter((c) => c !== currency.toUpperCase())
    .map((c) => ({ currency: c, amount: convertCurrency(amount, currency, c, rates)! }))
    .filter((x) => Number.isFinite(x.amount));
}

/** Combines a dialling code and a local number into international format, dropping a leading trunk 0. */
export function combinePhone(dialCode: unknown, local: unknown): string | undefined {
  const raw = typeof local === "string" ? local.trim() : "";
  if (!raw) return undefined;
  if (raw.startsWith("+")) return raw; // already international
  const code = typeof dialCode === "string" && /^\+\d{1,4}$/.test(dialCode) ? dialCode : "";
  if (!code) return raw;
  return `${code} ${raw.replace(/^0+/, "")}`;
}
