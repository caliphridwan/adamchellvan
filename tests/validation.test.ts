import { describe, expect, it } from "vitest";
import {
  investorSchema,
  requirementSchema,
  enquirySchema,
  formToObject,
  listingSubmissionSchema,
  propertySchema,
  settingsSchema,
  testimonialSchema,
  userCreateSchema,
} from "@/lib/validation";

const validEnquiry = {
  type: "GENERAL",
  name: "Ada Obi",
  email: "ADA@example.com ",
  phone: "+234 801 234 5678",
  message: "I would like more information please.",
  consent: "on",
  website: "",
};

describe("enquirySchema", () => {
  it("accepts a valid enquiry and normalises email", () => {
    const r = enquirySchema.safeParse(validEnquiry);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("ada@example.com");
  });

  it("requires consent", () => {
    const r = enquirySchema.safeParse({ ...validEnquiry, consent: undefined });
    expect(r.success).toBe(false);
  });

  it("rejects honeypot submissions", () => {
    const r = enquirySchema.safeParse({ ...validEnquiry, website: "http://spam" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path[0]).toBe("website");
  });

  it("requires a property and a future date for viewing requests", () => {
    const r = enquirySchema.safeParse({ ...validEnquiry, type: "VIEWING", preferredDate: "2000-01-01" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("propertyId");
      expect(paths).toContain("preferredDate");
    }
  });

  it("rejects off-site source paths", () => {
    expect(enquirySchema.safeParse({ ...validEnquiry, source: "https://evil.example" }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...validEnquiry, source: "/contact" }).success).toBe(true);
  });
});

describe("listingSubmissionSchema", () => {
  it("requires phone and details", () => {
    const r = listingSubmissionSchema.safeParse({ name: "Ada", email: "a@b.co", transactionType: "SALE", propertyType: "Duplex", location: "Ikeja", details: "short", consent: "on" });
    expect(r.success).toBe(false);
  });
});

const baseProperty = {
  title: "Four-bedroom detached house",
  description: "A verified description of the property that is long enough to pass validation.",
  transactionType: "SALE",
  status: "DRAFT",
  categoryId: "cat1",
  locationId: "loc1",
  amenityIds: [],
};

describe("propertySchema", () => {
  it("requires a price unless price on request", () => {
    expect(propertySchema.safeParse(baseProperty).success).toBe(false);
    expect(propertySchema.safeParse({ ...baseProperty, priceOnRequest: "on" }).success).toBe(true);
    const r = propertySchema.safeParse({ ...baseProperty, price: "150,000,000" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.price).toBe(150_000_000);
  });

  it("requires a unit when an area is given", () => {
    const r = propertySchema.safeParse({ ...baseProperty, priceOnRequest: "on", floorArea: "250" });
    expect(r.success).toBe(false);
  });

  it("requires a public map location when the map is shown", () => {
    expect(propertySchema.safeParse({ ...baseProperty, priceOnRequest: "on", showMap: "on" }).success).toBe(false);
  });

  it("rejects non-https media links", () => {
    expect(propertySchema.safeParse({ ...baseProperty, priceOnRequest: "on", videoUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(propertySchema.safeParse({ ...baseProperty, priceOnRequest: "on", videoUrl: "http://x.com/v" }).success).toBe(false);
  });

  it("converts empty optional inputs to undefined", () => {
    const r = propertySchema.safeParse({ ...baseProperty, priceOnRequest: "on", bedrooms: "", summary: "  " });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.bedrooms).toBeUndefined();
      expect(r.data.summary).toBeUndefined();
    }
  });
});

describe("testimonialSchema", () => {
  it("cannot be published without authorisation", () => {
    const r = testimonialSchema.safeParse({ authorName: "Client", quote: "Excellent service from the team.", isPublished: "on" });
    expect(r.success).toBe(false);
    expect(testimonialSchema.safeParse({ authorName: "Client", quote: "Excellent service from the team.", isPublished: "on", isAuthorised: "on" }).success).toBe(true);
  });
});

describe("settingsSchema", () => {
  it("normalises WhatsApp numbers to digits", () => {
    const r = settingsSchema.safeParse({ companyName: "Acme", currency: "ngn", whatsapp: "+234 (801) 234-5678" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.whatsapp).toBe("2348012345678");
      expect(r.data.currency).toBe("NGN");
    }
  });
});

describe("userCreateSchema", () => {
  it("enforces password strength", () => {
    expect(userCreateSchema.safeParse({ name: "Sam", email: "s@x.io", role: "AGENT", password: "short1" }).success).toBe(false);
    expect(userCreateSchema.safeParse({ name: "Sam", email: "s@x.io", role: "AGENT", password: "onlyletterslong" }).success).toBe(false);
    expect(userCreateSchema.safeParse({ name: "Sam", email: "s@x.io", role: "AGENT", password: "a-strong-pass-2026" }).success).toBe(true);
  });

  it("rejects unknown roles", () => {
    expect(userCreateSchema.safeParse({ name: "Sam", email: "s@x.io", role: "OWNER", password: "a-strong-pass-2026" }).success).toBe(false);
  });
});

describe("formToObject", () => {
  it("collects multi-value keys and skips framework fields", () => {
    const fd = new FormData();
    fd.append("title", "A");
    fd.append("amenityIds", "1");
    fd.append("amenityIds", "2");
    fd.append("$ACTION_ID_abc", "x");
    expect(formToObject(fd, ["amenityIds", "other"])).toEqual({ title: "A", amenityIds: ["1", "2"], other: [] });
  });
});

describe("lead forms", () => {
  const req = {
    name: "Tunde Bello",
    email: "tunde@example.com",
    phone: "+234 803 000 0000",
    transactionType: "SALE",
    propertyType: "4-bed duplex",
    preferredLocation: "Lekki",
    budget: "150m",
    timeline: "Within 3 months",
    consent: "on",
  };
  it("accepts a buyer requirement and defaults the budget currency", () => {
    const r = requirementSchema.safeParse(req);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.budgetCurrency).toBe("NGN");
  });
  it("requires a timeline and phone for requirements", () => {
    expect(requirementSchema.safeParse({ ...req, timeline: "someday" }).success).toBe(false);
    expect(requirementSchema.safeParse({ ...req, phone: "" }).success).toBe(false);
  });

  const inv = {
    name: "Ada Okafor",
    email: "ada@example.co.uk",
    countryOfResidence: "United Kingdom",
    preferredMarket: "Lagos — Ikoyi",
    budgetCurrency: "GBP",
    budget: "150k – 250k",
    objectives: ["Rental income", "Land acquisition"],
    preferredContact: "Video call",
    consent: "on",
  };
  it("accepts an international investor enquiry", () => {
    expect(investorSchema.safeParse(inv).success).toBe(true);
  });
  it("requires at least one known objective", () => {
    expect(investorSchema.safeParse({ ...inv, objectives: [] }).success).toBe(false);
    expect(investorSchema.safeParse({ ...inv, objectives: ["Guaranteed 40% returns"] }).success).toBe(false);
  });
  it("rejects unsafe attribution values", () => {
    expect(investorSchema.safeParse({ ...inv, utmSource: "<script>" }).success).toBe(false);
    expect(investorSchema.safeParse({ ...inv, utmSource: "instagram", utmMedium: "social", landingPage: "/rent-and-lease" }).success).toBe(true);
  });
});
