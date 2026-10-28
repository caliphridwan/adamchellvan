// String unions mirror the Prisma enums so this module stays dependency-free.

export const TRANSACTION_TYPES = ["SALE", "RENT", "LEASE"] as const;
export type TransactionTypeValue = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_LABELS: Record<TransactionTypeValue, string> = {
  SALE: "For sale",
  RENT: "For rent",
  LEASE: "For lease",
};

export const LISTING_STATUSES = [
  "DRAFT",
  "AVAILABLE",
  "UNDER_OFFER",
  "RESERVED",
  "SOLD",
  "RENTED",
  "WITHDRAWN",
  "ARCHIVED",
] as const;
export type ListingStatusValue = (typeof LISTING_STATUSES)[number];

export const STATUS_LABELS: Record<ListingStatusValue, string> = {
  DRAFT: "Draft",
  AVAILABLE: "Available",
  UNDER_OFFER: "Under offer",
  RESERVED: "Reserved",
  SOLD: "Sold",
  RENTED: "Let",
  WITHDRAWN: "Unavailable",
  ARCHIVED: "Archived",
};

/** Statuses a published listing may have and still be visible to the public. */
export const PUBLIC_STATUSES = ["AVAILABLE", "UNDER_OFFER", "RESERVED", "SOLD", "RENTED"] as const;
/** Default public catalogue view: only listings still on the market. */
export const ACTIVE_STATUSES = ["AVAILABLE", "UNDER_OFFER", "RESERVED"] as const;

export const AREA_UNITS = ["SQM", "SQFT", "HECTARE", "ACRE", "PLOT"] as const;

export const FURNISHING = ["UNFURNISHED", "SEMI_FURNISHED", "FURNISHED"] as const;
export type FurnishingValue = (typeof FURNISHING)[number];
export const FURNISHING_LABELS: Record<FurnishingValue, string> = {
  UNFURNISHED: "Unfurnished",
  SEMI_FURNISHED: "Semi-furnished",
  FURNISHED: "Furnished",
};

/** Search shortcut groups for category.group */
export const SEARCH_GROUPS = ["residential", "commercial", "land", "industrial"] as const;
export const SEARCH_GROUP_LABELS: Record<(typeof SEARCH_GROUPS)[number], string> = {
  residential: "Residential",
  commercial: "Commercial",
  land: "Land & development",
  industrial: "Industrial & warehouse",
};

export const CATEGORY_GROUPS = ["RESIDENTIAL", "COMMERCIAL", "LAND", "INDUSTRIAL", "OTHER"] as const;

export const ENQUIRY_TYPES = ["GENERAL", "PROPERTY", "VIEWING", "CONSULTATION", "LISTING_SUBMISSION", "REQUIREMENT", "INVESTOR"] as const;
export type EnquiryTypeValue = (typeof ENQUIRY_TYPES)[number];

export const ENQUIRY_TYPE_LABELS: Record<EnquiryTypeValue, string> = {
  GENERAL: "General enquiry",
  PROPERTY: "Property enquiry",
  VIEWING: "Inspection request",
  CONSULTATION: "Consultation request",
  LISTING_SUBMISSION: "Property listing submission",
  REQUIREMENT: "Property requirement / sourcing request",
  INVESTOR: "Investor / international enquiry",
};

export const ENQUIRY_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VIEWING_SCHEDULED",
  "CLOSED_WON",
  "CLOSED_LOST",
  "SPAM",
] as const;
export type EnquiryStatusValue = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatusValue, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  VIEWING_SCHEDULED: "Viewing scheduled",
  CLOSED_WON: "Closed — won",
  CLOSED_LOST: "Closed — lost",
  SPAM: "Spam",
};

export const VIEWING_TIMES = ["Morning", "Afternoon", "Evening"] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest listed" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "beds-desc", label: "Most bedrooms" },
  { value: "size-desc", label: "Largest floor area" },
] as const;

export const LISTED_WITHIN = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const;

export const PAGE_SIZE = 12;

/** Country dialling codes offered on forms (Nigeria first, then common diaspora locations). */
export const DIAL_CODES = [
  { code: "+234", label: "Nigeria (+234)" },
  { code: "+44", label: "United Kingdom (+44)" },
  { code: "+1", label: "USA / Canada (+1)" },
  { code: "+353", label: "Ireland (+353)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+31", label: "Netherlands (+31)" },
  { code: "+33", label: "France (+33)" },
  { code: "+39", label: "Italy (+39)" },
  { code: "+34", label: "Spain (+34)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+966", label: "Saudi Arabia (+966)" },
  { code: "+974", label: "Qatar (+974)" },
  { code: "+27", label: "South Africa (+27)" },
  { code: "+233", label: "Ghana (+233)" },
  { code: "+254", label: "Kenya (+254)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+86", label: "China (+86)" },
  { code: "+91", label: "India (+91)" },
] as const;

export const BUDGET_CURRENCIES = ["NGN", "USD", "GBP", "EUR", "CAD"] as const;

export const PURCHASE_TIMELINES = ["Immediately", "Within 3 months", "3–6 months", "6–12 months", "Just researching"] as const;

export const INTENDED_USES = ["Own home / family use", "Investment (rental income)", "Investment (capital growth)", "Business premises", "Development", "Other"] as const;

export const INVESTMENT_OBJECTIVES = [
  "Rental income",
  "Long-term capital growth",
  "Home for family in Nigeria",
  "Land acquisition",
  "Commercial property",
  "Property development",
] as const;

export const CONTACT_METHODS = ["WhatsApp", "Phone call", "Email", "Video call"] as const;

export const SUBMITTER_ROLES = ["Property owner", "Landlord", "Developer", "Authorised agent / representative"] as const;

export const PLACEHOLDER = {
  companyName: "[COMPANY NAME]",
  phone: "[PHONE NUMBER]",
  email: "[EMAIL ADDRESS]",
  address: "[OFFICE ADDRESS]",
  hours: "[BUSINESS HOURS]",
} as const;
