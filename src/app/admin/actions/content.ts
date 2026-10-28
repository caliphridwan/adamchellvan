"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { authorise } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import {
  amenitySchema,
  articleSchema,
  categorySchema,
  faqSchema,
  fieldErrors,
  formToObject,
  locationSchema,
  locationUpdateSchema,
  serviceSchema,
  settingsSchema,
  testimonialSchema,
  type FormState,
} from "@/lib/validation";

const DENIED: FormState = { ok: false, message: "You don't have permission to do that." };

function nullify<T extends Record<string, unknown>>(obj: T): { [K in keyof T]: Exclude<T[K], undefined> | null } {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === undefined ? null : v;
  return out as { [K in keyof T]: Exclude<T[K], undefined> | null };
}

function isUniqueError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

// ─── Site settings ───

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorise("settings.write");
  if (!user) return DENIED;
  const parsed = settingsSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const data = nullify(parsed.data);
  await db.siteSettings.upsert({
    where: { id: "site" },
    update: { ...data, companyName: parsed.data.companyName, currency: parsed.data.currency },
    create: { id: "site", ...data, companyName: parsed.data.companyName, currency: parsed.data.currency },
  });
  await logAudit({ userId: user.id, action: "settings.update", entity: "SiteSettings", entityId: "site" });
  revalidatePath("/", "layout");
  return { ok: true, message: "Site settings saved.", nonce: Date.now() };
}

// ─── Services ───

export async function saveService(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorise("content.write");
  if (!user) return DENIED;
  const parsed = serviceSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const d = parsed.data;
  const data = {
    title: d.title,
    slug: d.slug || slugify(d.title),
    summary: d.summary,
    body: d.body,
    isPublished: d.isPublished,
    sortOrder: d.sortOrder ?? 0,
    seoTitle: d.seoTitle ?? null,
    seoDescription: d.seoDescription ?? null,
  };
  try {
    const saved = id ? await db.service.update({ where: { id }, data }) : await db.service.create({ data });
    await logAudit({ userId: user.id, action: id ? "service.update" : "service.create", entity: "Service", entityId: saved.id, summary: d.title });
  } catch (err) {
    if (isUniqueError(err)) return { ok: false, errors: { slug: ["Another service already uses this URL slug"] }, message: "Please correct the highlighted fields." };
    throw err;
  }
  redirect(`/admin/content/services?notice=${id ? "saved" : "created"}`);
}

// ─── FAQs ───

export async function saveFaq(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorise("content.write");
  if (!user) return DENIED;
  const parsed = faqSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const d = parsed.data;
  const data = { question: d.question, answer: d.answer, isPublished: d.isPublished, sortOrder: d.sortOrder ?? 0 };
  const saved = id ? await db.faq.update({ where: { id }, data }) : await db.faq.create({ data });
  await logAudit({ userId: user.id, action: id ? "faq.update" : "faq.create", entity: "Faq", entityId: saved.id });
  redirect(`/admin/content/faqs?notice=${id ? "saved" : "created"}`);
}

// ─── Testimonials ───

export async function saveTestimonial(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorise("content.write");
  if (!user) return DENIED;
  const parsed = testimonialSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const d = parsed.data;
  const data = {
    authorName: d.authorName,
    authorRole: d.authorRole ?? null,
    quote: d.quote,
    isAuthorised: d.isAuthorised,
    isPublished: d.isPublished && d.isAuthorised,
    sortOrder: d.sortOrder ?? 0,
  };
  const saved = id ? await db.testimonial.update({ where: { id }, data }) : await db.testimonial.create({ data });
  await logAudit({ userId: user.id, action: id ? "testimonial.update" : "testimonial.create", entity: "Testimonial", entityId: saved.id, summary: d.isAuthorised ? "authorised" : "not authorised" });
  redirect(`/admin/content/testimonials?notice=${id ? "saved" : "created"}`);
}

// ─── Articles ───

export async function saveArticle(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorise("content.write");
  if (!user) return DENIED;
  const parsed = articleSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const d = parsed.data;
  const existing = id ? await db.article.findUnique({ where: { id }, select: { publishedAt: true } }) : null;
  const data = {
    title: d.title,
    slug: d.slug || slugify(d.title),
    excerpt: d.excerpt,
    body: d.body,
    coverImageUrl: d.coverImageUrl ?? null,
    coverImageAlt: d.coverImageAlt ?? null,
    isPublished: d.isPublished,
    publishedAt: d.isPublished ? existing?.publishedAt ?? new Date() : existing?.publishedAt ?? null,
    seoTitle: d.seoTitle ?? null,
    seoDescription: d.seoDescription ?? null,
  };
  try {
    const saved = id ? await db.article.update({ where: { id }, data }) : await db.article.create({ data: { ...data, authorId: user.id } });
    await logAudit({ userId: user.id, action: id ? "article.update" : "article.create", entity: "Article", entityId: saved.id, summary: d.title });
  } catch (err) {
    if (isUniqueError(err)) return { ok: false, errors: { slug: ["Another article already uses this URL slug"] }, message: "Please correct the highlighted fields." };
    throw err;
  }
  redirect(`/admin/content/articles?notice=${id ? "saved" : "created"}`);
}

// ─── Generic delete for simple content ───

const DELETABLE = {
  service: { path: "/admin/content/services", del: (id: string) => db.service.delete({ where: { id } }) },
  faq: { path: "/admin/content/faqs", del: (id: string) => db.faq.delete({ where: { id } }) },
  testimonial: { path: "/admin/content/testimonials", del: (id: string) => db.testimonial.delete({ where: { id } }) },
  article: { path: "/admin/content/articles", del: (id: string) => db.article.delete({ where: { id } }) },
} as const;

export async function deleteContent(formData: FormData): Promise<void> {
  const user = await authorise("content.write");
  if (!user) redirect("/admin?denied=1");
  const kind = String(formData.get("kind") ?? "") as keyof typeof DELETABLE;
  const id = String(formData.get("id") ?? "");
  const target = DELETABLE[kind];
  if (!target || !id) redirect("/admin/content");
  await target.del(id).catch(() => null);
  await logAudit({ userId: user.id, action: `${kind}.delete`, entity: kind, entityId: id });
  redirect(`${target.path}?notice=deleted`);
}

// ─── Taxonomy ───

export async function createCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorise("content.write");
  if (!user) return DENIED;
  const parsed = categorySchema.safeParse(formToObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  try {
    const c = await db.propertyCategory.create({
      data: { name: parsed.data.name, slug: slugify(parsed.data.name), group: parsed.data.group, sortOrder: parsed.data.sortOrder ?? 0 },
    });
    await logAudit({ userId: user.id, action: "category.create", entity: "PropertyCategory", entityId: c.id, summary: c.name });
  } catch (err) {
    if (isUniqueError(err)) return { ok: false, errors: { name: ["This category already exists"] }, message: "Please correct the highlighted fields." };
    throw err;
  }
  revalidatePath("/admin/content/taxonomy");
  return { ok: true, message: "Category added.", nonce: Date.now() };
}

export async function createLocation(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorise("content.write");
  if (!user) return DENIED;
  const parsed = locationSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const d = parsed.data;
  try {
    const l = await db.location.create({
      data: {
        name: d.name,
        slug: slugify([d.name, d.city].filter(Boolean).join(" ")),
        city: d.city ?? null,
        state: d.state ?? null,
        country: d.country ?? null,
        sortOrder: d.sortOrder ?? 0,
      },
    });
    await logAudit({ userId: user.id, action: "location.create", entity: "Location", entityId: l.id, summary: l.name });
  } catch (err) {
    if (isUniqueError(err)) return { ok: false, errors: { name: ["This location already exists"] }, message: "Please correct the highlighted fields." };
    throw err;
  }
  revalidatePath("/admin/content/taxonomy");
  return { ok: true, message: "Location added.", nonce: Date.now() };
}

export async function createAmenity(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorise("content.write");
  if (!user) return DENIED;
  const parsed = amenitySchema.safeParse(formToObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  try {
    const a = await db.amenity.create({ data: { name: parsed.data.name, slug: slugify(parsed.data.name) } });
    await logAudit({ userId: user.id, action: "amenity.create", entity: "Amenity", entityId: a.id, summary: a.name });
  } catch (err) {
    if (isUniqueError(err)) return { ok: false, errors: { name: ["This amenity already exists"] }, message: "Please correct the highlighted fields." };
    throw err;
  }
  revalidatePath("/admin/content/taxonomy");
  return { ok: true, message: "Amenity added.", nonce: Date.now() };
}

export async function deleteTaxonomy(formData: FormData): Promise<void> {
  const user = await authorise("content.write");
  if (!user) redirect("/admin?denied=1");
  const kind = String(formData.get("kind") ?? "");
  const id = String(formData.get("id") ?? "");
  let error: string | null = null;
  if (kind === "category") {
    const inUse = await db.property.count({ where: { categoryId: id } });
    if (inUse) error = "category-in-use";
    else await db.propertyCategory.delete({ where: { id } }).catch(() => null);
  } else if (kind === "location") {
    const inUse = await db.property.count({ where: { locationId: id } });
    if (inUse) {
      // Locations in use are deactivated (hidden from search) rather than deleted.
      await db.location.update({ where: { id }, data: { isActive: false } });
    } else {
      await db.location.delete({ where: { id } }).catch(() => null);
    }
  } else if (kind === "location-activate") {
    await db.location.update({ where: { id }, data: { isActive: true } });
  } else if (kind === "amenity") {
    await db.amenity.delete({ where: { id } }).catch(() => null);
  }
  if (!error) await logAudit({ userId: user.id, action: `${kind}.delete`, entity: kind, entityId: id });
  redirect(`/admin/content/taxonomy${error ? `?error=${error}` : "?notice=saved"}`);
}

export async function updateLocation(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorise("content.write");
  if (!user) return DENIED;
  const parsed = locationUpdateSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const d = parsed.data;
  await db.location.update({
    where: { id },
    data: {
      name: d.name,
      city: d.city ?? null,
      state: d.state ?? null,
      country: d.country ?? null,
      sortOrder: d.sortOrder ?? 0,
      description: d.description ?? null,
    },
  });
  await logAudit({ userId: user.id, action: "location.update", entity: "Location", entityId: id, summary: d.name });
  revalidatePath("/admin/content/taxonomy");
  return { ok: true, message: "Location saved.", nonce: Date.now() };
}
