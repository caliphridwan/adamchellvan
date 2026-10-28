import Link from "next/link";
import { FURNISHING, FURNISHING_LABELS, LISTED_WITHIN, SEARCH_GROUPS, SEARCH_GROUP_LABELS, STATUS_LABELS } from "@/lib/constants";
import type { SearchFilters } from "@/lib/search";
import { AutoCollapse } from "./AutoCollapse";

type Opt = { name: string; slug: string; _count?: { properties: number } };

// Server-rendered GET form: filters work without JavaScript, validate on the server and
// produce shareable URLs. On mobile it collapses into a native <details> disclosure.
export function FilterPanel({
  filters,
  categories,
  locations,
  amenities,
  states = [],
}: {
  filters: SearchFilters;
  categories: Opt[];
  locations: Opt[];
  amenities: Opt[];
  states?: string[];
}) {
  const activeCount = [
    filters.q,
    filters.type,
    filters.group,
    filters.state,
    filters.investment,
    filters.furnishing,
    filters.category,
    filters.location,
    filters.minPrice,
    filters.maxPrice,
    filters.beds,
    filters.baths,
    filters.minSize,
    filters.amenities?.length,
    filters.status,
    filters.listed,
  ].filter((v) => v !== undefined && v !== "" && v !== 0).length;

  return (
    <>
    {activeCount === 0 ? <AutoCollapse targetId="filter-panel" /> : null}
    <details id="filter-panel" className="group rounded-md border border-ivory-200 bg-white lg:sticky lg:top-[100px]" open>
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-5 text-sm font-semibold uppercase tracking-[0.14em] text-navy-900 lg:pointer-events-none [&::-webkit-details-marker]:hidden">
        <span>
          Refine search {activeCount ? <span className="ml-1 text-champagne-700">({activeCount})</span> : null}
        </span>
        <span aria-hidden="true" className="text-xl transition-transform group-open:rotate-45 lg:hidden">+</span>
      </summary>
      <form action="/properties" method="get" className="space-y-5 border-t border-ivory-200 p-5">
        {filters.sort !== "newest" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
        <div>
          <label htmlFor="flt-q" className="field-label">Keyword or reference</label>
          <input id="flt-q" name="q" type="search" defaultValue={filters.q ?? ""} maxLength={80} placeholder="e.g. waterfront, PE-2026-0012" className="field" />
        </div>
        <Select
          name="type"
          label="Transaction"
          value={filters.type}
          placeholder="Any"
          options={[
            { value: "SALE", label: "For sale" },
            { value: "LET", label: "Rent or lease" },
            { value: "RENT", label: "For rent" },
            { value: "LEASE", label: "For lease" },
          ]}
        />
        <Select name="group" label="Category" value={filters.group} placeholder="All categories" options={SEARCH_GROUPS.map((g) => ({ value: g, label: SEARCH_GROUP_LABELS[g] }))} />
        <Select name="category" label="Property type" value={filters.category} placeholder="All types" options={categories.map((c) => ({ value: c.slug, label: c.name }))} />
        {states.length > 1 ? (
          <Select name="state" label="State" value={filters.state} placeholder="All states" options={states.map((st) => ({ value: st, label: st }))} />
        ) : null}
        <Select name="location" label="Area / neighbourhood" value={filters.location} placeholder="All areas" options={locations.map((l) => ({ value: l.slug, label: l.name }))} />
        <fieldset>
          <legend className="field-label">Price range</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="flt-min" className="sr-only">Minimum price</label>
              <input id="flt-min" name="minPrice" type="number" inputMode="numeric" min={0} step="any" placeholder="Min" defaultValue={filters.minPrice ?? ""} className="field" />
            </div>
            <div>
              <label htmlFor="flt-max" className="sr-only">Maximum price</label>
              <input id="flt-max" name="maxPrice" type="number" inputMode="numeric" min={0} step="any" placeholder="Max" defaultValue={filters.maxPrice ?? ""} className="field" />
            </div>
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <Select name="beds" label="Bedrooms" value={filters.beds?.toString()} placeholder="Any" options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n}+` }))} />
          <Select name="baths" label="Bathrooms" value={filters.baths?.toString()} placeholder="Any" options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}+` }))} />
        </div>
        <div>
          <label htmlFor="flt-size" className="field-label">Minimum property / land size</label>
          <input id="flt-size" name="minSize" type="number" inputMode="numeric" min={0} placeholder="Floor area or plot size" defaultValue={filters.minSize ?? ""} className="field" />
          <p className="field-hint">In the unit shown on each listing (e.g. m²).</p>
        </div>
        <Select name="furnishing" label="Furnishing" value={filters.furnishing} placeholder="Any" options={FURNISHING.map((f) => ({ value: f, label: FURNISHING_LABELS[f] }))} />
        <div className="flex items-center gap-2.5">
          <input id="flt-investment" type="checkbox" name="investment" value="1" defaultChecked={filters.investment === "1"} className="h-4 w-4 accent-navy-900" />
          <label htmlFor="flt-investment" className="text-sm text-charcoal-700">Investment opportunities only</label>
        </div>
        {amenities.length ? (
          <fieldset>
            <legend className="field-label">Amenities</legend>
            <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {amenities.map((a) => {
                const id = `flt-am-${a.slug}`;
                return (
                  <li key={a.slug} className="flex items-center gap-2.5">
                    <input id={id} type="checkbox" name="amenities" value={a.slug} defaultChecked={filters.amenities?.includes(a.slug)} className="h-4 w-4 accent-navy-900" />
                    <label htmlFor={id} className="text-sm text-charcoal-700">{a.name}</label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ) : null}
        <Select
          name="status"
          label="Availability"
          value={filters.status}
          placeholder="On the market"
          options={(["AVAILABLE", "UNDER_OFFER", "RESERVED", "SOLD", "RENTED"] as const).map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
        />
        <Select name="listed" label="Date listed" value={filters.listed} placeholder="Any time" options={LISTED_WITHIN.map((l) => ({ value: l.value, label: l.label }))} />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1">Apply filters</button>
          <Link href="/properties" className="btn-ghost">Reset</Link>
        </div>
      </form>
    </details>
    </>
  );
}

function Select({
  name,
  label,
  value,
  placeholder,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  const id = `flt-${name}`;
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <select id={id} name={name} defaultValue={value ?? ""} className="field">
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
