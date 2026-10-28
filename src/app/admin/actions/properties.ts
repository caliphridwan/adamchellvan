"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type MediaKind } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { authorise } from "@/lib/auth";
import { PUBLIC_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import { deleteFile, uploadFile, UploadError } from "@/lib/upload";
import { slugify } from "@/lib/utils";
import { fieldErrors, formToObject, propertySchema, type FormState } from "@/lib/validation";

const DENIED: FormState = { ok: false, message: "You don't have permission to do that." };

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "property";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const clash = await db.property.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

async function nextReference(): Promise<string> {
  const prefix = (process.env.LISTING_REF_PREFIX ?? "REF").replace(/[^A-Z0-9]/gi, "").toUpperCase() || "REF";
  const year = new Date().getFullYear();
  const startsWith = `${prefix}-${year}-`;
  const last = await db.property.findFirst({
    where: { reference: { startsWith } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const n = last ? Number.parseInt(last.reference.slice(startsWith.length), 10) + 1 : 1;
  return `${startsWith}${String(Number.isFinite(n) ? n : 1).padStart(4, "0")}`;
}

export async function saveProperty(propertyId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorise("property.write");
  if (!user) return DENIED;

  const parsed = propertySchema.safeParse(formToObject(formData, ["amenityIds"]));
  if (!parsed.success) return fieldErrors(parsed.error);
  const d = parsed.data;

  const existing = propertyId
    ? await db.property.findUnique({ where: { id: propertyId }, select: { id: true, isPublished: true, slug: true } })
    : null;
  if (propertyId && !existing) return { ok: false, message: "This property no longer exists." };

  // A published listing may not be moved into a non-public status without being unpublished.
  if (existing?.isPublished && !(PUBLIC_STATUSES as readonly string[]).includes(d.status)) {
    return {
      ok: false,
      errors: { status: ["Unpublish the listing before setting this status"] },
      message: "Please correct the highlighted fields.",
    };
  }

  const [categoryOk, locationOk] = await Promise.all([
    db.propertyCategory.count({ where: { id: d.categoryId } }),
    db.location.count({ where: { id: d.locationId } }),
  ]);
  if (!categoryOk || !locationOk) return { ok: false, message: "Choose a valid category and location." };

  const slug = await uniqueSlug(d.slug || d.title, propertyId ?? undefined);
  const amenityConnect = d.amenityIds.map((id) => ({ id }));

  const data = {
    title: d.title,
    slug,
    summary: d.summary ?? null,
    description: d.description,
    transactionType: d.transactionType,
    status: d.status,
    categoryId: d.categoryId,
    locationId: d.locationId,
    price: d.priceOnRequest ? null : d.price ?? null,
    priceOnRequest: d.priceOnRequest,
    pricePeriod: d.pricePeriod ?? null,
    currency: d.currency,
    displayAddress: d.displayAddress ?? null,
    privateAddress: d.privateAddress ?? null,
    privateNotes: d.privateNotes ?? null,
    ownerName: d.ownerName ?? null,
    ownerContact: d.ownerContact ?? null,
    showMap: d.showMap,
    mapQuery: d.mapQuery ?? null,
    bedrooms: d.bedrooms ?? null,
    bathrooms: d.bathrooms ?? null,
    toilets: d.toilets ?? null,
    parkingSpaces: d.parkingSpaces ?? null,
    floorArea: d.floorArea ?? null,
    floorAreaUnit: d.floorAreaUnit ?? null,
    plotSize: d.plotSize ?? null,
    plotSizeUnit: d.plotSizeUnit ?? null,
    yearBuilt: d.yearBuilt ?? null,
    titleDocument: d.titleDocument ?? null,
    videoUrl: d.videoUrl ?? null,
    virtualTourUrl: d.virtualTourUrl ?? null,
    seoTitle: d.seoTitle ?? null,
    seoDescription: d.seoDescription ?? null,
    isFeatured: d.isFeatured,
    isInvestment: d.isInvestment,
    estate: d.estate ?? null,
    furnishing: d.furnishing ?? null,
    ...(d.markReviewed ? { lastReviewedAt: new Date() } : {}),
  };

  let id = propertyId;
  try {
    if (existing) {
      await db.property.update({ where: { id: existing.id }, data: { ...data, amenities: { set: amenityConnect } } });
      await logAudit({ userId: user.id, action: "property.update", entity: "Property", entityId: existing.id, summary: d.title });
    } else {
      // Retry once if two editors create a listing at the same moment and the reference collides.
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const created = await db.property.create({
            data: { ...data, reference: await nextReference(), amenities: { connect: amenityConnect } },
            select: { id: true, reference: true },
          });
          id = created.id;
          await logAudit({ userId: user.id, action: "property.create", entity: "Property", entityId: created.id, summary: `${created.reference} ${d.title}` });
          break;
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && attempt < 2) continue;
          throw err;
        }
      }
    }
  } catch (err) {
    console.error("[property] save failed", (err as Error).message);
    return { ok: false, message: "The listing could not be saved. Please try again." };
  }

  revalidatePath("/admin/properties");
  redirect(`/admin/properties/${id}?notice=${existing ? "saved" : "created"}`);
}

export async function setPublished(formData: FormData): Promise<void> {
  const user = await authorise("property.publish");
  if (!user) redirect("/admin?denied=1");
  const id = String(formData.get("id") ?? "");
  const publish = formData.get("publish") === "1";
  const property = await db.property.findUnique({ where: { id }, select: { id: true, status: true, publishedAt: true, title: true } });
  if (!property) redirect("/admin/properties");

  if (publish && !(PUBLIC_STATUSES as readonly string[]).includes(property.status)) {
    redirect(`/admin/properties/${id}?error=status`);
  }
  await db.property.update({
    where: { id },
    data: { isPublished: publish, ...(publish && !property.publishedAt ? { publishedAt: new Date() } : {}) },
  });
  await logAudit({ userId: user.id, action: publish ? "property.publish" : "property.unpublish", entity: "Property", entityId: id, summary: property.title });
  revalidatePath(`/admin/properties/${id}`);
  redirect(`/admin/properties/${id}?notice=${publish ? "published" : "unpublished"}`);
}

export async function archiveProperty(formData: FormData): Promise<void> {
  const user = await authorise("property.write");
  if (!user) redirect("/admin?denied=1");
  const id = String(formData.get("id") ?? "");
  const p = await db.property.update({ where: { id }, data: { status: "ARCHIVED", isPublished: false, isFeatured: false }, select: { title: true } });
  await logAudit({ userId: user.id, action: "property.archive", entity: "Property", entityId: id, summary: p.title });
  redirect(`/admin/properties/${id}?notice=archived`);
}

export async function deleteProperty(formData: FormData): Promise<void> {
  const user = await authorise("property.delete");
  if (!user) redirect("/admin?denied=1");
  const id = String(formData.get("id") ?? "");
  const property = await db.property.findUnique({
    where: { id },
    select: { title: true, reference: true, media: { select: { publicId: true, kind: true } } },
  });
  if (!property) redirect("/admin/properties");
  await db.property.delete({ where: { id } });
  await Promise.all(
    property.media
      .filter((m) => m.publicId)
      .map((m) => deleteFile(m.publicId!, m.kind === "BROCHURE" ? "document" : "image")),
  );
  await logAudit({ userId: user.id, action: "property.delete", entity: "Property", entityId: id, summary: `${property.reference} ${property.title}` });
  revalidatePath("/admin/properties");
  redirect("/admin/properties?notice=deleted");
}

// ─── Media ───

export async function uploadMedia(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorise("property.write");
  if (!user) return DENIED;
  const propertyId = String(formData.get("propertyId") ?? "");
  const kindRaw = String(formData.get("kind") ?? "IMAGE");
  const kind: MediaKind = kindRaw === "FLOOR_PLAN" ? "FLOOR_PLAN" : kindRaw === "BROCHURE" ? "BROCHURE" : "IMAGE";
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { ok: false, message: "Choose at least one file to upload." };
  if (files.length > 20) return { ok: false, message: "Upload at most 20 files at a time." };

  const property = await db.property.findUnique({ where: { id: propertyId }, select: { id: true, reference: true, title: true } });
  if (!property) return { ok: false, message: "This property no longer exists." };

  const last = await db.propertyMedia.findFirst({ where: { propertyId, kind }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  let order = (last?.sortOrder ?? -1) + 1;
  const errors: string[] = [];
  let uploaded = 0;

  for (const file of files) {
    try {
      const result = await uploadFile(file, kind === "BROCHURE" ? "document" : "image", `properties/${property.reference}`);
      await db.propertyMedia.create({
        data: {
          propertyId,
          kind,
          url: result.url,
          publicId: result.publicId,
          width: result.width ?? null,
          height: result.height ?? null,
          alt: kind === "BROCHURE" ? null : property.title,
          sortOrder: order++,
        },
      });
      uploaded++;
    } catch (err) {
      errors.push(err instanceof UploadError ? err.message : `“${file.name}” could not be uploaded.`);
      if (!(err instanceof UploadError)) console.error("[media] upload failed", (err as Error).message);
    }
  }
  if (uploaded) {
    await logAudit({ userId: user.id, action: "property.media_upload", entity: "Property", entityId: propertyId, summary: `${uploaded} ${kind.toLowerCase()} file(s)` });
  }
  revalidatePath(`/admin/properties/${propertyId}`);
  if (errors.length) {
    return { ok: uploaded > 0, message: `${uploaded} uploaded. ${errors.join(" ")}`, nonce: Date.now() };
  }
  return { ok: true, message: `${uploaded} file${uploaded === 1 ? "" : "s"} uploaded.`, nonce: Date.now() };
}

export async function updateMedia(formData: FormData): Promise<void> {
  const user = await authorise("property.write");
  if (!user) redirect("/admin?denied=1");
  const mediaId = String(formData.get("mediaId") ?? "");
  const intent = String(formData.get("intent") ?? "");
  const media = await db.propertyMedia.findUnique({ where: { id: mediaId } });
  if (!media) return;

  if (intent === "delete") {
    await db.propertyMedia.delete({ where: { id: mediaId } });
    if (media.publicId) await deleteFile(media.publicId, media.kind === "BROCHURE" ? "document" : "image");
    await logAudit({ userId: user.id, action: "property.media_delete", entity: "Property", entityId: media.propertyId });
  } else if (intent === "up" || intent === "down" || intent === "first") {
    const siblings = await db.propertyMedia.findMany({
      where: { propertyId: media.propertyId, kind: media.kind },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    const ids = siblings.map((s) => s.id);
    const idx = ids.indexOf(mediaId);
    if (intent === "first" && idx > 0) {
      ids.splice(idx, 1);
      ids.unshift(mediaId);
    } else {
      const swap = intent === "up" ? idx - 1 : idx + 1;
      if (idx >= 0 && swap >= 0 && swap < ids.length) [ids[idx], ids[swap]] = [ids[swap]!, ids[idx]!];
    }
    await db.$transaction(ids.map((id, i) => db.propertyMedia.update({ where: { id }, data: { sortOrder: i } })));
  } else if (intent === "alt") {
    const alt = String(formData.get("alt") ?? "").trim().slice(0, 200);
    await db.propertyMedia.update({ where: { id: mediaId }, data: { alt: alt || null } });
  }
  revalidatePath(`/admin/properties/${media.propertyId}`);
}
