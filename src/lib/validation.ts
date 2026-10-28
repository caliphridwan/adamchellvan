import { z } from "zod";
import {
  BUDGET_CURRENCIES,
  CONTACT_METHODS,
  FURNISHING,
  INTENDED_USES,
  INVESTMENT_OBJECTIVES,
  PURCHASE_TIMELINES,
  SUBMITTER_ROLES,
  AREA_UNITS,
  CATEGORY_GROUPS,
  ENQUIRY_STATUSES,
  ENQUIRY_TYPES,
  LISTING_STATUSES,
  TRANSACTION_TYPES,
  VIEWING_TIMES,
} from "./constants";

// ─── Shared preprocessors (FormData gives strings; empty inputs become undefined) ───

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const optText = (max: number) => z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
export const reqText = (min: number, max: number, label = "This field") =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

export const optInt = (min: number, max: number) =>
  z.preprocess(emptyToUndefined, z.coerce.number().int().min(min).max(max).optional());

export const optDecimal = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? emptyToUndefined(v.replace(/,/g, "")) : v),
    z.coerce.number().min(0).max(max).optional(),
  );

export const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const optHttpsUrl = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .max(600)
    .url("Enter a full URL")
    .refine((u) => u.startsWith("https://"), "URL must start with https://")
    .optional(),
);

const phoneRegex = /^[+()\d\s.-]{7,22}$/;
export const optPhone = z.preprocess(
  emptyToUndefined,
  z.string().trim().regex(phoneRegex, "Enter a valid phone number").optional(),
);

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(160);

const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only")
  .max(80);

export const optSlug = z.preprocess(emptyToUndefined, slugField.optional());

// Honeypot: real users never see or fill this field.
const honeypot = z.preprocess((v) => (v == null ? "" : v), z.string().max(0, "Invalid submission"));

// ─── Public forms ───

// First-touch attribution captured client-side (utm_* params or referring site). Short, safe strings only.
const attrText = z.preprocess(emptyToUndefined, z.string().trim().max(120).regex(/^[\w .:/?=&%+@-]*$/).optional());
export const attributionFields = {
  utmSource: attrText,
  utmMedium: attrText,
  utmCampaign: attrText,
  landingPage: attrText,
};

export const enquirySchema = z
  .object({
    type: z.enum(ENQUIRY_TYPES).default("GENERAL"),
    name: reqText(2, 100, "Name"),
    email,
    phone: optPhone,
    message: reqText(10, 3000, "Message"),
    propertyId: z.preprocess(emptyToUndefined, z.string().regex(/^[a-z0-9]{10,40}$/).optional()),
    preferredDate: z.preprocess(emptyToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date").optional()),
    preferredTime: z.preprocess(emptyToUndefined, z.enum(VIEWING_TIMES).optional()),
    consent: z.preprocess((v) => v === "on" || v === true, z.literal(true, { errorMap: () => ({ message: "Please confirm we may contact you" }) })),
    source: z.preprocess(emptyToUndefined, z.string().max(200).regex(/^\/[^\s]*$/).optional()),
    remoteConsultation: checkbox,
    website: honeypot,
    ...attributionFields,
  })
  .superRefine((val, ctx) => {
    if (val.type === "VIEWING") {
      if (!val.propertyId) ctx.addIssue({ code: "custom", path: ["propertyId"], message: "Select a property" });
      if (!val.preferredDate) {
        ctx.addIssue({ code: "custom", path: ["preferredDate"], message: "Choose a preferred date" });
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const chosen = new Date(`${val.preferredDate}T00:00:00`);
        if (Number.isNaN(chosen.getTime()) || chosen < today) {
          ctx.addIssue({ code: "custom", path: ["preferredDate"], message: "Choose a date from today onwards" });
        }
      }
    }
  });
export type EnquiryInput = z.infer<typeof enquirySchema>;

export const listingSubmissionSchema = z.object({
  submitterRole: z.enum(SUBMITTER_ROLES, { errorMap: () => ({ message: "Tell us your relationship to the property" }) }),
  name: reqText(2, 100, "Name"),
  email,
  phone: z.string().trim().regex(phoneRegex, "Enter a valid phone number"),
  transactionType: z.enum(TRANSACTION_TYPES, { errorMap: () => ({ message: "Choose sale, rent or lease" }) }),
  propertyType: reqText(2, 80, "Property type"),
  location: reqText(2, 160, "Location"),
  askingPrice: optText(60),
  details: reqText(20, 3000, "Property details"),
  consent: z.preprocess((v) => v === "on" || v === true, z.literal(true, { errorMap: () => ({ message: "Please confirm we may contact you" }) })),
  website: honeypot,
  ...attributionFields,
});

const consentTrue = z.preprocess((v) => v === "on" || v === true, z.literal(true, { errorMap: () => ({ message: "Please confirm we may contact you" }) }));
const budgetCurrency = z.preprocess(emptyToUndefined, z.enum(BUDGET_CURRENCIES).default("NGN"));

/** Buyer / tenant requirement — captures leads even when no listing matches yet. */
export const requirementSchema = z.object({
  name: reqText(2, 100, "Name"),
  email,
  phone: z.string({ required_error: "Enter a phone number" }).trim().regex(phoneRegex, "Enter a valid phone number"),
  transactionType: z.enum(TRANSACTION_TYPES, { errorMap: () => ({ message: "Choose buy, rent or lease" }) }),
  propertyType: reqText(2, 80, "Property type"),
  preferredLocation: reqText(2, 160, "Preferred location"),
  budgetCurrency,
  budget: reqText(1, 60, "Budget"),
  bedrooms: optInt(0, 20),
  intendedUse: z.preprocess(emptyToUndefined, z.enum(INTENDED_USES).optional()),
  timeline: z.enum(PURCHASE_TIMELINES, { errorMap: () => ({ message: "Choose a timeline" }) }),
  message: optText(3000),
  consent: consentTrue,
  website: honeypot,
  ...attributionFields,
});

/** International / diaspora investor enquiry. */
export const investorSchema = z.object({
  name: reqText(2, 100, "Name"),
  email,
  phone: optPhone,
  countryOfResidence: reqText(2, 80, "Country of residence"),
  timeZone: optText(60),
  preferredMarket: reqText(2, 160, "Preferred market"),
  budgetCurrency,
  budget: reqText(1, 60, "Budget range"),
  objectives: z.array(z.enum(INVESTMENT_OBJECTIVES)).min(1, "Choose at least one objective").max(INVESTMENT_OBJECTIVES.length),
  preferredContact: z.enum(CONTACT_METHODS, { errorMap: () => ({ message: "Choose a contact method" }) }),
  remoteConsultation: checkbox,
  message: optText(3000),
  consent: consentTrue,
  website: honeypot,
  ...attributionFields,
});

export const newsletterSchema = z.object({
  email,
  consent: z.preprocess((v) => v === "on" || v === true, z.literal(true, { errorMap: () => ({ message: "Please tick the box to subscribe" }) })),
  website: honeypot,
});

// ─── Auth ───

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(200),
  next: z.preprocess(emptyToUndefined, z.string().regex(/^\/admin(\/[^\s]*)?$/).optional()),
});

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(200)
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), "Include at least one letter and one number");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const userCreateSchema = z.object({
  name: reqText(2, 100, "Name"),
  email,
  role: z.enum(["ADMIN", "EDITOR", "AGENT"]),
  password: passwordSchema,
});

export const userUpdateSchema = z.object({
  id: z.string().min(1),
  name: reqText(2, 100, "Name"),
  role: z.enum(["ADMIN", "EDITOR", "AGENT"]),
  isActive: checkbox,
  newPassword: z.preprocess(emptyToUndefined, passwordSchema.optional()),
});

// ─── Admin: properties ───

export const propertySchema = z
  .object({
    title: reqText(5, 160, "Title"),
    slug: optSlug,
    summary: optText(320),
    description: reqText(30, 20000, "Description"),
    transactionType: z.enum(TRANSACTION_TYPES),
    status: z.enum(LISTING_STATUSES),
    categoryId: z.string().min(1, "Choose a category"),
    locationId: z.string().min(1, "Choose a location"),
    price: optDecimal(1_000_000_000_000),
    priceOnRequest: checkbox,
    pricePeriod: optText(40),
    currency: z.preprocess(emptyToUndefined, z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code").default("NGN")),
    displayAddress: optText(200),
    privateAddress: optText(300),
    privateNotes: optText(5000),
    ownerName: optText(120),
    ownerContact: optText(160),
    showMap: checkbox,
    mapQuery: optText(200),
    bedrooms: optInt(0, 50),
    bathrooms: optInt(0, 50),
    toilets: optInt(0, 50),
    parkingSpaces: optInt(0, 500),
    floorArea: optDecimal(10_000_000),
    floorAreaUnit: z.preprocess(emptyToUndefined, z.enum(AREA_UNITS).optional()),
    plotSize: optDecimal(10_000_000),
    plotSizeUnit: z.preprocess(emptyToUndefined, z.enum(AREA_UNITS).optional()),
    yearBuilt: optInt(1800, 2100),
    furnishing: z.preprocess(emptyToUndefined, z.enum(FURNISHING).optional()),
    estate: optText(120),
    isInvestment: checkbox,
    titleDocument: optText(120),
    videoUrl: optHttpsUrl,
    virtualTourUrl: optHttpsUrl,
    seoTitle: optText(70),
    seoDescription: optText(320),
    isFeatured: checkbox,
    markReviewed: checkbox,
    amenityIds: z.array(z.string().min(1)).max(80).default([]),
  })
  .superRefine((v, ctx) => {
    if (!v.priceOnRequest && v.price === undefined) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Enter a price or tick “Price on request”" });
    }
    if (v.floorArea !== undefined && !v.floorAreaUnit) {
      ctx.addIssue({ code: "custom", path: ["floorAreaUnit"], message: "Choose a unit" });
    }
    if (v.plotSize !== undefined && !v.plotSizeUnit) {
      ctx.addIssue({ code: "custom", path: ["plotSizeUnit"], message: "Choose a unit" });
    }
    if (v.showMap && !v.mapQuery) {
      ctx.addIssue({ code: "custom", path: ["mapQuery"], message: "Enter the public map location or untick “Show map”" });
    }
  });
export type PropertyInput = z.infer<typeof propertySchema>;

export const mediaMetaSchema = z.object({
  mediaId: z.string().min(1),
  alt: optText(200),
});

// ─── Admin: enquiries ───

export const enquiryUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(ENQUIRY_STATUSES),
  assignedToId: z.preprocess(emptyToUndefined, z.string().optional()),
  propertyId: z.preprocess(emptyToUndefined, z.string().optional()),
  followUpAt: z.preprocess(emptyToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
});

export const enquiryNoteSchema = z.object({
  enquiryId: z.string().min(1),
  body: reqText(1, 5000, "Note"),
});

// ─── Admin: content ───

export const serviceSchema = z.object({
  title: reqText(3, 120, "Title"),
  slug: optSlug,
  summary: reqText(10, 320, "Summary"),
  body: reqText(30, 20000, "Body"),
  isPublished: checkbox,
  sortOrder: optInt(0, 1000),
  seoTitle: optText(70),
  seoDescription: optText(320),
});

export const faqSchema = z.object({
  question: reqText(5, 300, "Question"),
  answer: reqText(5, 5000, "Answer"),
  isPublished: checkbox,
  sortOrder: optInt(0, 1000),
});

export const testimonialSchema = z
  .object({
    authorName: reqText(2, 120, "Name"),
    authorRole: optText(120),
    quote: reqText(10, 2000, "Quote"),
    isAuthorised: checkbox,
    isPublished: checkbox,
    sortOrder: optInt(0, 1000),
  })
  .refine((v) => !v.isPublished || v.isAuthorised, {
    path: ["isPublished"],
    message: "Confirm the client authorised this testimonial before publishing it",
  });

export const articleSchema = z.object({
  title: reqText(5, 160, "Title"),
  slug: optSlug,
  excerpt: reqText(20, 400, "Excerpt"),
  body: reqText(50, 50000, "Body"),
  coverImageUrl: optHttpsUrl,
  coverImageAlt: optText(200),
  isPublished: checkbox,
  seoTitle: optText(70),
  seoDescription: optText(320),
});

export const categorySchema = z.object({
  name: reqText(2, 60, "Name"),
  group: z.enum(CATEGORY_GROUPS),
  sortOrder: optInt(0, 1000),
});

export const locationSchema = z.object({
  name: reqText(2, 80, "Name"),
  city: optText(80),
  state: optText(80),
  country: optText(80),
  sortOrder: optInt(0, 1000),
});

export const locationUpdateSchema = locationSchema.extend({
  description: optText(10000),
});

export const amenitySchema = z.object({
  name: reqText(2, 60, "Name"),
});

export const settingsSchema = z.object({
  companyName: reqText(1, 120, "Company name"),
  brandPrimary: optText(60),
  brandSecondary: optText(80),
  slogan: optText(160),
  shortDescription: optText(600),
  logoUrl: optHttpsUrl,
  heroImageUrl: optHttpsUrl,
  heroImageAlt: optText(200),
  heroEyebrow: optText(80),
  heroHeadline: optText(160),
  heroSubtext: optText(400),
  heroSearchHeading: optText(120),
  heroSearchText: optText(200),
  servicesStrip: optText(200),
  categoryCards: optText(2000),
  approachHeading: optText(160),
  approachBody: optText(3000),
  internationalHeading: optText(160),
  internationalBody: optText(3000),
  internationalCtaText: optText(200),
  fxRates: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(500)
      .refine((t) => t.split(/\n|;/).every((l) => !l.trim() || /^[A-Za-z]{3}\s*[=:]\s*[\d.,]+$/.test(l.trim())), "Use one rate per line, e.g. USD=1550")
      .optional(),
  ),
  fxRatesDate: optText(40),
  listingDisclaimer: optText(1000),
  introHeading: optText(160),
  introBody: optText(3000),
  aboutStory: optText(10000),
  mission: optText(1000),
  vision: optText(1000),
  values: optText(3000),
  differentiators: optText(3000),
  insightsHeading: optText(160),
  insightsBody: optText(2000),
  ctaHeading: optText(160),
  ctaBody: optText(600),
  phone: optPhone,
  whatsapp: z.preprocess(
    (v) => (typeof v === "string" ? emptyToUndefined(v.replace(/\D/g, "")) : v),
    z.string().regex(/^\d{8,15}$/, "Use international format digits, e.g. 2348012345678").optional(),
  ),
  email: z.preprocess(emptyToUndefined, email.optional()),
  officeAddress: optText(500),
  businessHours: optText(500),
  mapQuery: optText(200),
  facebookUrl: optHttpsUrl,
  instagramUrl: optHttpsUrl,
  linkedinUrl: optHttpsUrl,
  xUrl: optHttpsUrl,
  youtubeUrl: optHttpsUrl,
  tiktokUrl: optHttpsUrl,
  footerNote: optText(600),
  registrationInfo: optText(160),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code"),
  seoTitle: optText(70),
  seoDescription: optText(320),
});

// ─── Form helpers ───

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  /** Changes on every successful submission so forms can reset themselves. */
  nonce?: number;
};

export const initialFormState: FormState = { ok: false };

export function formToObject(fd: FormData, multiKeys: string[] = []): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of fd.entries()) {
    if (key.startsWith("$ACTION")) continue;
    if (typeof value !== "string") continue;
    if (multiKeys.includes(key)) {
      const arr = (obj[key] as string[] | undefined) ?? [];
      arr.push(value);
      obj[key] = arr;
    } else {
      obj[key] = value;
    }
  }
  for (const k of multiKeys) if (!(k in obj)) obj[k] = [];
  return obj;
}

export function fieldErrors(error: z.ZodError): FormState {
  return {
    ok: false,
    message: "Please correct the highlighted fields.",
    errors: error.flatten().fieldErrors as Record<string, string[] | undefined>,
  };
}
