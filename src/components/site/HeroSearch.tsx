import { IconSearch } from "@/components/icons";

type Option = { name: string; slug: string };

// Plain GET form → /properties, so search works without JavaScript and produces shareable URLs.
export function HeroSearch({ locations, categories, currency }: { locations: Option[]; categories: Option[]; currency: string }) {
  const priceSteps = [5_000_000, 20_000_000, 50_000_000, 100_000_000, 250_000_000, 500_000_000, 1_000_000_000];
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat("en", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(n);
    } catch {
      return n.toLocaleString("en");
    }
  };
  return (
    <form
      action="/properties"
      method="get"
      role="search"
      aria-label="Property search"
      className="grid gap-px overflow-hidden rounded-md bg-ivory-300 shadow-lift sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto]"
    >
      <SearchSelect name="location" label="Location" placeholder="All locations" options={locations.map((l) => ({ value: l.slug, label: l.name }))} />
      <SearchSelect
        name="type"
        label="Purpose"
        placeholder="Buy, rent, lease or invest"
        options={[
          { value: "SALE", label: "Buy" },
          { value: "LET", label: "Rent or lease" },
          { value: "RENT", label: "Rent" },
          { value: "LEASE", label: "Lease" },
          { value: "INVEST", label: "Invest" },
        ]}
      />
      <SearchSelect name="category" label="Property type" placeholder="All types" options={categories.map((c) => ({ value: c.slug, label: c.name }))} />
      <SearchSelect name="minPrice" label="Min price" placeholder="No minimum" options={priceSteps.map((p) => ({ value: String(p), label: fmt(p) }))} />
      <SearchSelect name="maxPrice" label="Max price" placeholder="No maximum" options={priceSteps.map((p) => ({ value: String(p), label: fmt(p) }))} />
      <div className="bg-white p-2 sm:col-span-2 lg:col-span-1">
        <button type="submit" className="btn-primary h-full w-full min-h-[56px] px-8">
          <IconSearch className="h-4 w-4" />
          Explore properties
        </button>
      </div>
    </form>
  );
}

function SearchSelect({
  name,
  label,
  placeholder,
  options,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  const id = `hero-${name}`;
  return (
    <div className="bg-white px-5 pb-3 pt-3.5">
      <label htmlFor={id} className="block text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-champagne-700">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue=""
        className="mt-1 block min-h-[32px] w-full cursor-pointer appearance-none bg-transparent text-[0.95rem] text-navy-900 focus:outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
