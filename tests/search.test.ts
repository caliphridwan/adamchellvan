import { describe, expect, it } from "vitest";
import { buildPropertyOrderBy, buildPropertyWhere, filtersToQuery, hasActiveFilters, parseSearchParams } from "@/lib/search";

describe("parseSearchParams", () => {
  it("returns defaults for empty params", () => {
    const f = parseSearchParams({});
    expect(f).toEqual({ sort: "newest", page: 1 });
    expect(hasActiveFilters(f)).toBe(false);
  });

  it("parses and coerces valid values", () => {
    const f = parseSearchParams({ type: "RENT", beds: "3", minPrice: "1000000", location: "Lekki-Phase-1", sort: "price-asc", page: "2" });
    expect(f).toMatchObject({ type: "RENT", beds: 3, minPrice: 1_000_000, location: "lekki-phase-1", sort: "price-asc", page: 2 });
  });

  it("drops invalid or malicious values instead of failing", () => {
    const f = parseSearchParams({
      type: "STEAL",
      beds: "-4",
      location: "'; DROP TABLE \"Property\"; --",
      sort: "random",
      page: "0",
      status: "DRAFT",
      q: "x".repeat(200),
    });
    expect(f).toEqual({ sort: "newest", page: 1 });
  });

  it("never accepts non-public statuses", () => {
    for (const status of ["DRAFT", "WITHDRAWN", "ARCHIVED"]) {
      expect(parseSearchParams({ status }).status).toBeUndefined();
    }
    expect(parseSearchParams({ status: "SOLD" }).status).toBe("SOLD");
  });

  it("swaps an inverted price range", () => {
    const f = parseSearchParams({ minPrice: "500", maxPrice: "100" });
    expect(f.minPrice).toBe(100);
    expect(f.maxPrice).toBe(500);
  });

  it("accepts repeated amenity params and comma lists", () => {
    expect(parseSearchParams({ amenities: ["swimming-pool", "gym"] }).amenities).toEqual(["swimming-pool", "gym"]);
    expect(parseSearchParams({ amenities: "gym,parking" }).amenities).toEqual(["gym", "parking"]);
  });
});

describe("buildPropertyWhere", () => {
  it("always restricts to published listings with an on-market status by default", () => {
    const where = buildPropertyWhere(parseSearchParams({}));
    expect(where.isPublished).toBe(true);
    expect(where.status).toEqual({ in: ["AVAILABLE", "UNDER_OFFER", "RESERVED"] });
  });

  it("keeps the published guard when a status filter is chosen", () => {
    const where = buildPropertyWhere(parseSearchParams({ status: "SOLD" }));
    expect(where.isPublished).toBe(true);
    expect(where.status).toBe("SOLD");
  });

  it("combines multiple filters", () => {
    const now = new Date("2026-10-28T12:00:00Z");
    const where = buildPropertyWhere(
      parseSearchParams({ type: "SALE", category: "duplex", location: "ikoyi", beds: "4", baths: "3", minPrice: "10", maxPrice: "20", listed: "7", amenities: "gym,pool" }),
      now,
    );
    expect(where).toMatchObject({
      transactionType: "SALE",
      category: { slug: "duplex" },
      location: { slug: "ikoyi" },
      bedrooms: { gte: 4 },
      bathrooms: { gte: 3 },
      publishedAt: { gte: new Date("2026-10-21T12:00:00Z") },
    });
    expect(where.AND).toEqual([
      { price: { gte: 10, lte: 20 } },
      { amenities: { some: { slug: "gym" } } },
      { amenities: { some: { slug: "pool" } } },
    ]);
  });
});

describe("client-specific filters", () => {
  it("treats LET as rent or lease", () => {
    const where = buildPropertyWhere(parseSearchParams({ type: "LET" }));
    expect(where.transactionType).toEqual({ in: ["RENT", "LEASE"] });
  });

  it("maps the hero 'Invest' purpose to the investment flag", () => {
    const f = parseSearchParams({ type: "INVEST" });
    expect(f.type).toBeUndefined();
    expect(f.investment).toBe("1");
    expect(buildPropertyWhere(f).isInvestment).toBe(true);
  });

  it("filters by category group, state, furnishing and area together", () => {
    const where = buildPropertyWhere(parseSearchParams({ group: "land", category: "land", state: "Lagos", location: "lekki", furnishing: "FURNISHED" }));
    expect(where.category).toEqual({ slug: "land", group: "LAND" });
    expect(where.location).toEqual({ slug: "lekki", state: { equals: "Lagos", mode: "insensitive" } });
    expect(where.furnishing).toBe("FURNISHED");
  });

  it("rejects unknown groups and odd state strings", () => {
    const f = parseSearchParams({ group: "castles", state: "<script>" });
    expect(f.group).toBeUndefined();
    expect(f.state).toBeUndefined();
  });
});

describe("ordering and URLs", () => {
  it("sorts by price with nulls last", () => {
    expect(buildPropertyOrderBy("price-asc")[0]).toEqual({ price: { sort: "asc", nulls: "last" } });
  });

  it("round-trips filters through the query string", () => {
    const f = parseSearchParams({ type: "SALE", beds: "2", amenities: "gym,parking", sort: "price-desc" });
    const qs = filtersToQuery(f, { page: 3 });
    expect(qs).toBe("?type=SALE&beds=2&amenities=gym%2Cparking&sort=price-desc&page=3");
    const back = parseSearchParams(Object.fromEntries(new URLSearchParams(qs.slice(1))));
    expect(back).toEqual({ ...f, page: 3 });
  });

  it("omits defaults from the query string", () => {
    expect(filtersToQuery(parseSearchParams({}))).toBe("");
  });
});
