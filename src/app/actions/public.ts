"use server";

import type { EnquiryType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ENQUIRY_TYPE_LABELS } from "@/lib/constants";
import { sendEmail, staffRecipients } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { isStorageConfigured, uploadFile, UploadError } from "@/lib/upload";
import { absoluteUrl, combinePhone, formatDate } from "@/lib/utils";
import {
  enquirySchema,
  fieldErrors,
  formToObject,
  investorSchema,
  listingSubmissionSchema,
  newsletterSchema,
  requirementSchema,
  type FormState,
} from "@/lib/validation";

const TOO_MANY: FormState = {
  ok: false,
  message: "You've sent several messages in a short time. Please wait a few minutes and try again.",
};

const SERVER_ERROR: FormState = {
  ok: false,
  message: "Something went wrong on our side and your message was not sent. Please try again, or contact us by phone or WhatsApp.",
};

const MAX_SUBMISSION_PHOTOS = 6;
const MAX_SUBMISSION_BYTES = 10 * 1024 * 1024;

/** Reads form data, merging the country-code picker into a single international phone number. */
function readForm(formData: FormData, multiKeys: string[] = []) {
  const raw = formToObject(formData, multiKeys);
  const phone = combinePhone(raw.phoneCountry, raw.phone);
  raw.phone = phone ?? "";
  delete raw.phoneCountry;
  return raw;
}

const isHoneypot = (error: { issues: { path: (string | number)[] }[] }) => error.issues.some((i) => i.path[0] === "website");

type Attribution = { utmSource?: string; utmMedium?: string; utmCampaign?: string; landingPage?: string };
const attribution = (a: Attribution) => ({
  utmSource: a.utmSource ?? null,
  utmMedium: a.utmMedium ?? null,
  utmCampaign: a.utmCampaign ?? null,
  landingPage: a.landingPage ?? null,
});

/** Stores the lead's structured answers as readable "Label: value" lines for staff emails. */
function describe(details: Record<string, unknown>): string[] {
  return Object.entries(details)
    .filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}: ${Array.isArray(v) ? v.join(", ") : String(v)}`);
}

async function notifyNewLead(opts: {
  enquiryId: string;
  type: EnquiryType;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  lines?: string[];
  subjectSuffix?: string;
  customerIntro: string;
}) {
  const settings = await getSettings();
  const label = ENQUIRY_TYPE_LABELS[opts.type];
  const staff = staffRecipients(settings.email);
  if (staff.length) {
    await sendEmail({
      to: staff,
      replyTo: opts.email,
      subject: `New ${label.toLowerCase()}${opts.subjectSuffix ? ` — ${opts.subjectSuffix}` : ""}`,
      text: [
        `${label} received via the website.`,
        "",
        `Name: ${opts.name}`,
        `Email: ${opts.email}`,
        opts.phone ? `Phone: ${opts.phone}` : null,
        ...(opts.lines ?? []),
        "",
        opts.message ?? null,
        "",
        `Open in dashboard: ${absoluteUrl(`/admin/enquiries/${opts.enquiryId}`)}`,
      ]
        .filter((l) => l !== null)
        .join("\n"),
    });
  }
  await sendEmail({
    to: opts.email,
    replyTo: settings.email ?? undefined,
    subject: `We've received your ${label.toLowerCase()} — ${settings.companyName}`,
    text: [
      `Dear ${opts.name},`,
      "",
      `Thank you for contacting ${settings.companyName}. ${opts.customerIntro} A member of our team will be in touch.`,
      "",
      settings.whatsapp ? `You can also reach us on WhatsApp: https://wa.me/${settings.whatsapp}` : null,
      settings.phone ? `Phone: ${settings.phone}` : null,
      "",
      settings.listingDisclaimer ? settings.listingDisclaimer : null,
      "",
      `— ${settings.companyName}`,
      settings.slogan ?? null,
    ]
      .filter((l) => l !== null)
      .join("\n"),
  });
}

// ─── Property enquiry, inspection request, consultation, general contact ───

export async function submitEnquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = readForm(formData);
  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    // Silently "succeed" for honeypot hits so bots get no signal.
    if (isHoneypot(parsed.error)) return { ok: true, message: "Thank you." };
    return fieldErrors(parsed.error);
  }
  if (!(await rateLimit("enquiry", 5, 600))) return TOO_MANY;

  const data = parsed.data;
  try {
    let propertyId: string | null = null;
    let propertyTitle: string | null = null;
    let propertyRef: string | null = null;
    const refInput = typeof raw.propertyReference === "string" ? raw.propertyReference.trim().toUpperCase().slice(0, 40) : "";

    if (data.propertyId || refInput) {
      const property = await db.property.findFirst({
        where: { isPublished: true, ...(data.propertyId ? { id: data.propertyId } : { reference: refInput }) },
        select: { id: true, title: true, reference: true },
      });
      if (property) {
        propertyId = property.id;
        propertyTitle = property.title;
        propertyRef = property.reference;
      } else if (data.type === "VIEWING") {
        return { ok: false, message: "That property is no longer available for inspections." };
      }
    }

    const type: EnquiryType = data.type === "GENERAL" && propertyId ? "PROPERTY" : data.type;
    const extras = [
      refInput && !propertyId ? `(Property reference given: ${refInput})` : null,
      data.remoteConsultation ? "(Requested a remote consultation — video or phone)" : null,
    ].filter(Boolean);
    const enquiry = await db.enquiry.create({
      data: {
        type,
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        message: extras.length ? `${data.message}\n\n${extras.join("\n")}` : data.message,
        propertyId,
        preferredDate: data.preferredDate ? new Date(`${data.preferredDate}T12:00:00Z`) : null,
        preferredTime: data.preferredTime ?? null,
        consentToContact: true,
        source: data.source ?? null,
        ...attribution(data),
      },
      select: { id: true },
    });

    await notifyNewLead({
      enquiryId: enquiry.id,
      type,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      subjectSuffix: propertyRef ?? undefined,
      lines: [
        propertyTitle ? `Property: ${propertyTitle} (${propertyRef})` : "",
        data.preferredDate ? `Preferred inspection: ${formatDate(data.preferredDate)} ${data.preferredTime ?? ""}` : "",
        data.remoteConsultation ? "Remote consultation requested" : "",
        data.utmSource ? `Source: ${data.utmSource}${data.utmMedium ? ` / ${data.utmMedium}` : ""}` : "",
      ].filter(Boolean),
      customerIntro: `We've received your ${ENQUIRY_TYPE_LABELS[type].toLowerCase()}${propertyTitle ? ` about “${propertyTitle}”` : ""}.`,
    });

    return {
      ok: true,
      message:
        type === "VIEWING"
          ? "Thank you — your inspection request has been received. We'll contact you to confirm a suitable time."
          : "Thank you — your message has been received. A member of our team will be in touch shortly.",
    };
  } catch (err) {
    console.error("[enquiry] failed", (err as Error).message);
    return SERVER_ERROR;
  }
}

// ─── Buyer / tenant requirement (property sourcing) ───

export async function submitRequirement(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = requirementSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    if (isHoneypot(parsed.error)) return { ok: true, message: "Thank you." };
    return fieldErrors(parsed.error);
  }
  if (!(await rateLimit("requirement", 5, 1800))) return TOO_MANY;
  const d = parsed.data;
  const details = {
    transactionType: d.transactionType === "SALE" ? "Buy" : d.transactionType === "RENT" ? "Rent" : "Lease",
    propertyType: d.propertyType,
    preferredLocation: d.preferredLocation,
    budget: `${d.budgetCurrency} ${d.budget}`,
    bedrooms: d.bedrooms ?? null,
    intendedUse: d.intendedUse ?? null,
    timeline: d.timeline,
  };
  try {
    const enquiry = await db.enquiry.create({
      data: {
        type: "REQUIREMENT",
        name: d.name,
        email: d.email,
        phone: d.phone,
        message: d.message || `Looking to ${details.transactionType.toLowerCase()} ${d.propertyType} in ${d.preferredLocation}.`,
        submissionData: details as Prisma.InputJsonObject,
        consentToContact: true,
        source: "requirement-form",
        ...attribution(d),
      },
      select: { id: true },
    });
    await notifyNewLead({
      enquiryId: enquiry.id,
      type: "REQUIREMENT",
      name: d.name,
      email: d.email,
      phone: d.phone,
      message: d.message,
      subjectSuffix: `${d.propertyType}, ${d.preferredLocation}`,
      lines: describe(details),
      customerIntro: "We've received your property requirements and will review them against suitable options where available.",
    });
    return {
      ok: true,
      message: "Thank you — we've received your requirements. Our team will review them and respond with suitable options where available.",
    };
  } catch (err) {
    console.error("[requirement] failed", (err as Error).message);
    return SERVER_ERROR;
  }
}

// ─── International / diaspora investor ───

export async function submitInvestor(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = investorSchema.safeParse(readForm(formData, ["objectives"]));
  if (!parsed.success) {
    if (isHoneypot(parsed.error)) return { ok: true, message: "Thank you." };
    return fieldErrors(parsed.error);
  }
  if (!(await rateLimit("investor", 5, 1800))) return TOO_MANY;
  const d = parsed.data;
  const details = {
    countryOfResidence: d.countryOfResidence,
    timeZone: d.timeZone ?? null,
    preferredMarket: d.preferredMarket,
    budget: `${d.budgetCurrency} ${d.budget}`,
    objectives: d.objectives,
    preferredContact: d.preferredContact,
    remoteConsultation: d.remoteConsultation ? "Yes" : "No",
  };
  try {
    const enquiry = await db.enquiry.create({
      data: {
        type: "INVESTOR",
        name: d.name,
        email: d.email,
        phone: d.phone ?? null,
        message: d.message || `Investor enquiry from ${d.countryOfResidence}: ${d.objectives.join(", ")}.`,
        submissionData: details as Prisma.InputJsonObject,
        consentToContact: true,
        source: "investor-form",
        ...attribution(d),
      },
      select: { id: true },
    });
    await notifyNewLead({
      enquiryId: enquiry.id,
      type: "INVESTOR",
      name: d.name,
      email: d.email,
      phone: d.phone,
      message: d.message,
      subjectSuffix: `${d.countryOfResidence} → ${d.preferredMarket}`,
      lines: describe(details),
      customerIntro: `We've received your investor enquiry and will contact you by ${d.preferredContact.toLowerCase()}${d.timeZone ? `, taking your time zone (${d.timeZone}) into account` : ""}.`,
    });
    return {
      ok: true,
      message: `Thank you — your enquiry has been received. We'll contact you by ${d.preferredContact.toLowerCase()} to arrange a suitable time.`,
    };
  } catch (err) {
    console.error("[investor] failed", (err as Error).message);
    return SERVER_ERROR;
  }
}

// ─── Seller / landlord / developer submission (with optional photos) ───

export async function submitListing(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = listingSubmissionSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    if (isHoneypot(parsed.error)) return { ok: true, message: "Thank you." };
    return fieldErrors(parsed.error);
  }
  if (!(await rateLimit("listing", 3, 1800))) return TOO_MANY;
  const d = parsed.data;

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_SUBMISSION_PHOTOS) {
    return { ok: false, errors: { photos: [`Attach up to ${MAX_SUBMISSION_PHOTOS} photos`] }, message: "Please correct the highlighted fields." };
  }
  if (files.reduce((n, f) => n + f.size, 0) > MAX_SUBMISSION_BYTES) {
    return { ok: false, errors: { photos: ["Photos must be 10 MB or less in total"] }, message: "Please correct the highlighted fields." };
  }

  const photos: string[] = [];
  const photoErrors: string[] = [];
  if (files.length && isStorageConfigured()) {
    for (const file of files) {
      try {
        const r = await uploadFile(file, "image", "submissions");
        photos.push(r.url);
      } catch (err) {
        photoErrors.push(err instanceof UploadError ? err.message : `“${file.name}” could not be uploaded.`);
      }
    }
  }

  const details = {
    submitterRole: d.submitterRole,
    transactionType: d.transactionType,
    propertyType: d.propertyType,
    location: d.location,
    askingPrice: d.askingPrice ?? null,
    photos,
  };
  try {
    const enquiry = await db.enquiry.create({
      data: {
        type: "LISTING_SUBMISSION",
        name: d.name,
        email: d.email,
        phone: d.phone,
        message: d.details,
        consentToContact: true,
        source: "/list-your-property",
        submissionData: details as Prisma.InputJsonObject,
        ...attribution(d),
      },
      select: { id: true },
    });
    await notifyNewLead({
      enquiryId: enquiry.id,
      type: "LISTING_SUBMISSION",
      name: d.name,
      email: d.email,
      phone: d.phone,
      message: d.details,
      subjectSuffix: `${d.propertyType}, ${d.location}`,
      lines: [...describe({ ...details, photos: undefined }), photos.length ? `Photos: ${photos.length} attached (view in dashboard)` : ""].filter(Boolean),
      customerIntro: "We've received your property details and will review them before contacting you about next steps.",
    });
    return {
      ok: true,
      message: `Thank you — we've received your property details${photos.length ? ` and ${photos.length} photo${photos.length === 1 ? "" : "s"}` : ""}. Our team will review them and contact you shortly.${
        photoErrors.length ? ` Note: ${photoErrors.join(" ")}` : ""
      }`,
    };
  } catch (err) {
    console.error("[listing] failed", (err as Error).message);
    return SERVER_ERROR;
  }
}

// ─── Newsletter ───

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newsletterSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    if (isHoneypot(parsed.error)) return { ok: true, message: "Thank you." };
    return fieldErrors(parsed.error);
  }
  if (!(await rateLimit("newsletter", 5, 3600))) return TOO_MANY;
  try {
    const consentText = "I agree to receive property updates and insights by email. I can unsubscribe at any time.";
    await db.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: { unsubscribedAt: null, consentAt: new Date(), consentText },
      create: { email: parsed.data.email, consentText },
    });
    return { ok: true, message: "Thank you for subscribing." };
  } catch (err) {
    console.error("[newsletter] failed", (err as Error).message);
    return SERVER_ERROR;
  }
}
