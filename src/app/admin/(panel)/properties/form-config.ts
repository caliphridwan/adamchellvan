import type { Amenity, Location, Property, PropertyCategory } from "@prisma/client";
import type { FormValues, SectionDef } from "@/components/admin/EntityForm";
import { AREA_UNITS, FURNISHING, FURNISHING_LABELS, LISTING_STATUSES, STATUS_LABELS, TRANSACTION_LABELS, TRANSACTION_TYPES } from "@/lib/constants";

const AREA_UNIT_LABELS: Record<(typeof AREA_UNITS)[number], string> = {
  SQM: "Square metres (m²)",
  SQFT: "Square feet",
  HECTARE: "Hectares",
  ACRE: "Acres",
  PLOT: "Plots",
};

export function propertySections(opts: {
  categories: Pick<PropertyCategory, "id" | "name">[];
  locations: Pick<Location, "id" | "name">[];
  amenities: Pick<Amenity, "id" | "name">[];
  defaultCurrency: string;
}): SectionDef[] {
  const units = AREA_UNITS.map((u) => ({ value: u, label: AREA_UNIT_LABELS[u] }));
  return [
    {
      title: "Listing",
      fields: [
        { type: "text", name: "title", label: "Title", required: true, hint: "Descriptive and verified, e.g. “4-bedroom detached house with pool”." },
        { type: "select", name: "transactionType", label: "Transaction", required: true, span: 1, options: TRANSACTION_TYPES.map((t) => ({ value: t, label: TRANSACTION_LABELS[t] })) },
        { type: "select", name: "status", label: "Status", required: true, span: 1, options: LISTING_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })), hint: "Publishing requires Available, Under offer, Reserved, Sold or Let." },
        { type: "select", name: "categoryId", label: "Category", required: true, span: 1, placeholder: "Choose…", options: opts.categories.map((c) => ({ value: c.id, label: c.name })) },
        { type: "select", name: "locationId", label: "Location", required: true, span: 1, placeholder: "Choose…", options: opts.locations.map((l) => ({ value: l.id, label: l.name })) },
        { type: "textarea", name: "summary", label: "Short summary", rows: 2, hint: "One or two sentences shown at the top of the listing (max 320 characters)." },
        { type: "textarea", name: "description", label: "Full description", required: true, rows: 10, hint: "Verified details only. Separate paragraphs with a blank line." },
        { type: "checkbox", name: "isFeatured", label: "Featured listing (shown on the homepage)", span: 1 },
        { type: "checkbox", name: "isInvestment", label: "Show under Investment Opportunities", span: 1 },
      ],
    },
    {
      title: "Price",
      fields: [
        { type: "number", name: "price", label: "Asking price", span: 1, step: "any", hint: "Leave blank if price on request." },
        { type: "text", name: "currency", label: "Currency", span: 1, hint: `3-letter code. Default ${opts.defaultCurrency}.` },
        { type: "text", name: "pricePeriod", label: "Price period", span: 1, placeholder: "e.g. per annum", hint: "For rentals and leases." },
        { type: "checkbox", name: "priceOnRequest", label: "Price on request (hide the price)", span: 1 },
      ],
    },
    {
      title: "Specifications",
      description: "Only fill in figures that have been verified.",
      fields: [
        { type: "number", name: "bedrooms", label: "Bedrooms", span: 1 },
        { type: "number", name: "bathrooms", label: "Bathrooms", span: 1 },
        { type: "number", name: "toilets", label: "Toilets", span: 1 },
        { type: "number", name: "parkingSpaces", label: "Parking spaces", span: 1 },
        { type: "number", name: "floorArea", label: "Floor area", span: 1, step: "any" },
        { type: "select", name: "floorAreaUnit", label: "Floor area unit", span: 1, placeholder: "—", options: units },
        { type: "number", name: "plotSize", label: "Plot size", span: 1, step: "any" },
        { type: "select", name: "plotSizeUnit", label: "Plot size unit", span: 1, placeholder: "—", options: units },
        { type: "number", name: "yearBuilt", label: "Year built", span: 1 },
        { type: "text", name: "titleDocument", label: "Title document", span: 1, hint: "Only when verified, e.g. C of O, Governor's Consent." },
        { type: "select", name: "furnishing", label: "Furnishing", span: 1, placeholder: "—", options: FURNISHING.map((f) => ({ value: f, label: FURNISHING_LABELS[f] })) },
        { type: "checkboxes", name: "amenityIds", label: "Amenities", options: opts.amenities.map((a) => ({ value: a.id, label: a.name })), hint: "Manage the list under Content › Taxonomy." },
      ],
    },
    {
      title: "Location & map",
      description: "Never enter a private street address in the public fields.",
      fields: [
        { type: "text", name: "estate", label: "Estate / development name", span: 1, hint: "Public. Only if approved for publication." },
        { type: "text", name: "displayAddress", label: "Public area description", span: 1, hint: "Shown publicly, e.g. “Off Admiralty Way”." },
        { type: "checkbox", name: "showMap", label: "Show a map on the listing", span: 1 },
        { type: "text", name: "mapQuery", label: "Public map location", span: 1, hint: "An area or landmark approved for publication." },
      ],
    },
    {
      title: "Media links",
      fields: [
        { type: "url", name: "videoUrl", label: "Video URL", span: 1, placeholder: "https://…" },
        { type: "url", name: "virtualTourUrl", label: "Virtual tour URL", span: 1, placeholder: "https://…" },
      ],
    },
    {
      title: "Private (staff only)",
      description: "These fields are never shown on the public website.",
      fields: [
        { type: "textarea", name: "privateAddress", label: "Full address", rows: 2 },
        { type: "text", name: "ownerName", label: "Owner / landlord name", span: 1 },
        { type: "text", name: "ownerContact", label: "Owner contact", span: 1 },
        { type: "textarea", name: "privateNotes", label: "Internal notes", rows: 3 },
      ],
    },
    {
      title: "Search engines",
      fields: [
        { type: "text", name: "slug", label: "URL slug", hint: "Leave blank to generate from the title." },
        { type: "text", name: "seoTitle", label: "SEO title", hint: "Max 70 characters. Defaults to the listing title." },
        { type: "textarea", name: "seoDescription", label: "SEO description", rows: 2, hint: "Max 320 characters. Defaults to the summary." },
        { type: "checkbox", name: "markReviewed", label: "I have reviewed this listing's details today", span: 2 },
      ],
    },
  ];
}

export function propertyValues(p: (Property & { amenities: { id: string }[] }) | null, defaultCurrency: string): FormValues {
  if (!p) return { transactionType: "SALE", status: "DRAFT", currency: defaultCurrency, amenityIds: [] };
  return {
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    description: p.description,
    transactionType: p.transactionType,
    status: p.status,
    categoryId: p.categoryId,
    locationId: p.locationId,
    price: p.price?.toString() ?? null,
    priceOnRequest: p.priceOnRequest,
    pricePeriod: p.pricePeriod,
    currency: p.currency,
    displayAddress: p.displayAddress,
    privateAddress: p.privateAddress,
    privateNotes: p.privateNotes,
    ownerName: p.ownerName,
    ownerContact: p.ownerContact,
    showMap: p.showMap,
    mapQuery: p.mapQuery,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    toilets: p.toilets,
    parkingSpaces: p.parkingSpaces,
    floorArea: p.floorArea?.toString() ?? null,
    floorAreaUnit: p.floorAreaUnit,
    plotSize: p.plotSize?.toString() ?? null,
    plotSizeUnit: p.plotSizeUnit,
    yearBuilt: p.yearBuilt,
    titleDocument: p.titleDocument,
    videoUrl: p.videoUrl,
    virtualTourUrl: p.virtualTourUrl,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    isFeatured: p.isFeatured,
    isInvestment: p.isInvestment,
    estate: p.estate,
    furnishing: p.furnishing,
    amenityIds: p.amenities.map((a) => a.id),
  };
}
