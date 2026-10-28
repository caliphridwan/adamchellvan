import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { ACTIVE_STATUSES, FURNISHING, PAGE_SIZE, PUBLIC_STATUSES, SEARCH_GROUPS, TRANSACTION_TYPES } from "./constants";

/** "LET" is a search shortcut meaning rent OR lease. */
export const SEARCH_TYPES = [...TRANSACTION_TYPES, "LET"] as const;

// ─── Public property search: URL params → validated filters → Prisma query ───
// Every value is validated server-side; Prisma parameterises all queries, so no raw SQL is built here.

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{1,80}$/);

const nonNegInt = (max: number) => z.coerce.number().int().min(0).max(max);

const fieldSchemas = {
  q: z.string().trim().min(1).max(80),
  location: slug,
  type: z.enum(SEARCH_TYPES),
  category: slug,
  group: z.enum(SEARCH_GROUPS),
  state: z.string().trim().regex(/^[A-Za-z][A-Za-z .'-]{1,59}$/),
  investment: z.enum(["1"]),
  furnishing: z.enum(FURNISHING),
  minPrice: nonNegInt(1_000_000_000_000),
  maxPrice: nonNegInt(1_000_000_000_000),
  beds: nonNegInt(20),
  baths: nonNegInt(20),
  minSize: nonNegInt(10_000_000),
  amenities: z
    .string()
    .trim()
    .max(400)
    .transform((s) => s.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean))
    .pipe(z.array(slug).max(15)),
  status: z.enum(PUBLIC_STATUSES),
  listed: z.enum(["7", "30", "90"]),
  sort: z.enum(["newest", "price-asc", "price-desc", "beds-desc", "size-desc"]),
  page: z.coerce.number().int().min(1).max(500),
} as const;

type FieldKey = keyof typeof fieldSchemas;

export type SearchFilters = {
  q?: string;
  location?: string;
  type?: (typeof SEARCH_TYPES)[number];
  category?: string;
  group?: (typeof SEARCH_GROUPS)[number];
  state?: string;
  investment?: "1";
  furnishing?: (typeof FURNISHING)[number];
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  minSize?: number;
  amenities?: string[];
  status?: (typeof PUBLIC_STATUSES)[number];
  listed?: "7" | "30" | "90";
  sort: "newest" | "price-asc" | "price-desc" | "beds-desc" | "size-desc";
  page: number;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * Lenient parse: each field is validated independently and invalid values are dropped,
 * so a malformed shared URL still returns sensible results rather than an error page.
 */
export function parseSearchParams(input: RawSearchParams): SearchFilters {
  // The hero search offers "Invest" as a purpose; it maps to the investment flag.
  const raw: RawSearchParams = { ...input };
  if (raw.type === "INVEST") {
    delete raw.type;
    raw.investment = "1";
  }
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(fieldSchemas) as FieldKey[]) {
    const v = raw[key];
    // Checkbox groups (amenities) arrive as repeated params; everything else takes the first value.
    const value = Array.isArray(v) ? (key === "amenities" ? v.join(",") : v[0]) : v;
    if (value === undefined || value === "") continue;
    const parsed = fieldSchemas[key].safeParse(value);
    if (parsed.success) out[key] = parsed.data;
  }
  const filters = out as Partial<SearchFilters>;
  // Swap an inverted price range instead of returning nothing.
  if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
    [filters.minPrice, filters.maxPrice] = [filters.maxPrice, filters.minPrice];
  }
  if (filters.amenities && filters.amenities.length === 0) delete filters.amenities;
  return { sort: "newest", page: 1, ...filters } as SearchFilters;
}

export function buildPropertyWhere(f: SearchFilters, now: Date = new Date()): Prisma.PropertyWhereInput {
  const and: Prisma.PropertyWhereInput[] = [];

  if (f.q) {
    and.push({
      OR: [
        { title: { contains: f.q, mode: "insensitive" } },
        { summary: { contains: f.q, mode: "insensitive" } },
        { displayAddress: { contains: f.q, mode: "insensitive" } },
        { reference: { equals: f.q.toUpperCase() } },
        { location: { name: { contains: f.q, mode: "insensitive" } } },
      ],
    });
  }

  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    and.push({
      price: {
        ...(f.minPrice !== undefined ? { gte: f.minPrice } : {}),
        ...(f.maxPrice !== undefined ? { lte: f.maxPrice } : {}),
      },
    });
  }

  if (f.minSize !== undefined) {
    and.push({ OR: [{ floorArea: { gte: f.minSize } }, { plotSize: { gte: f.minSize } }] });
  }

  for (const amenity of f.amenities ?? []) {
    and.push({ amenities: { some: { slug: amenity } } });
  }

  const where: Prisma.PropertyWhereInput = {
    // Hard public-visibility guard: never relax these two conditions.
    isPublished: true,
    status: f.status ? f.status : { in: [...ACTIVE_STATUSES] },
    ...(f.type === "LET" ? { transactionType: { in: ["RENT", "LEASE"] as ("RENT" | "LEASE")[] } } : f.type ? { transactionType: f.type } : {}),
    ...(f.category || f.group
      ? {
          category: {
            ...(f.category ? { slug: f.category } : {}),
            ...(f.group ? { group: f.group.toUpperCase() } : {}),
          },
        }
      : {}),
    ...(f.location || f.state
      ? {
          location: {
            ...(f.location ? { slug: f.location } : {}),
            ...(f.state ? { state: { equals: f.state, mode: "insensitive" as const } } : {}),
          },
        }
      : {}),
    ...(f.investment ? { isInvestment: true } : {}),
    ...(f.furnishing ? { furnishing: f.furnishing } : {}),
    ...(f.beds !== undefined ? { bedrooms: { gte: f.beds } } : {}),
    ...(f.baths !== undefined ? { bathrooms: { gte: f.baths } } : {}),
    ...(f.listed ? { publishedAt: { gte: new Date(now.getTime() - Number(f.listed) * 86_400_000) } } : {}),
    ...(and.length ? { AND: and } : {}),
  };
  return where;
}

export function buildPropertyOrderBy(sort: SearchFilters["sort"]): Prisma.PropertyOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ price: { sort: "asc", nulls: "last" } }, { publishedAt: "desc" }];
    case "price-desc":
      return [{ price: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }];
    case "beds-desc":
      return [{ bedrooms: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }];
    case "size-desc":
      return [{ floorArea: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }];
    default:
      return [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
  }
}

export function paginationArgs(page: number) {
  return { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

/** Serialises filters back to a query string (for shareable URLs and pagination links). */
export function filtersToQuery(f: Partial<SearchFilters>, overrides: Partial<Record<keyof SearchFilters, unknown>> = {}): string {
  const merged: Record<string, unknown> = { ...f, ...overrides };
  const params = new URLSearchParams();
  const order: (keyof SearchFilters)[] = [
    "q",
    "type",
    "group",
    "category",
    "state",
    "location",
    "investment",
    "furnishing",
    "minPrice",
    "maxPrice",
    "beds",
    "baths",
    "minSize",
    "amenities",
    "status",
    "listed",
    "sort",
    "page",
  ];
  for (const key of order) {
    const v = merged[key];
    if (v === undefined || v === null || v === "") continue;
    if (key === "sort" && v === "newest") continue;
    if (key === "page" && Number(v) <= 1) continue;
    if (Array.isArray(v)) {
      if (v.length) params.set(key, v.join(","));
    } else {
      params.set(key, String(v));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function hasActiveFilters(f: SearchFilters): boolean {
  return Boolean(
    f.q ||
      f.type ||
      f.group ||
      f.state ||
      f.investment ||
      f.furnishing ||
      f.category ||
      f.location ||
      f.minPrice !== undefined ||
      f.maxPrice !== undefined ||
      f.beds !== undefined ||
      f.baths !== undefined ||
      f.minSize !== undefined ||
      f.amenities?.length ||
      f.status ||
      f.listed,
  );
}
