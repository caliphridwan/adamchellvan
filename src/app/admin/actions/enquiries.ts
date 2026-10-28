"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { authorise, type SessionUser } from "@/lib/auth";
import { ENQUIRY_STATUS_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { enquiryNoteSchema, enquiryUpdateSchema, fieldErrors, formToObject, type FormState } from "@/lib/validation";

const DENIED: FormState = { ok: false, message: "You don't have permission to do that." };

/** Agents may only act on enquiries assigned to them. */
async function loadScoped(user: SessionUser, id: string) {
  const enquiry = await db.enquiry.findUnique({ where: { id }, select: { id: true, status: true, assignedToId: true, propertyId: true, followUpAt: true } });
  if (!enquiry) return null;
  if (!can(user.role, "enquiry.readAll") && enquiry.assignedToId !== user.id) return null;
  return enquiry;
}

export async function updateEnquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorise("enquiry.write");
  if (!user) return DENIED;
  const parsed = enquiryUpdateSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const d = parsed.data;
  const enquiry = await loadScoped(user, d.id);
  if (!enquiry) return DENIED;

  const canAssign = can(user.role, "enquiry.assign");
  if (d.assignedToId && canAssign) {
    const assignee = await db.user.count({ where: { id: d.assignedToId, isActive: true } });
    if (!assignee) return { ok: false, errors: { assignedToId: ["Choose an active staff member"] }, message: "Please correct the highlighted fields." };
  }
  if (d.propertyId) {
    const exists = await db.property.count({ where: { id: d.propertyId } });
    if (!exists) return { ok: false, errors: { propertyId: ["Choose a valid property"] }, message: "Please correct the highlighted fields." };
  }

  const followUpAt = d.followUpAt ? new Date(`${d.followUpAt}T09:00:00Z`) : null;
  await db.enquiry.update({
    where: { id: d.id },
    data: {
      status: d.status,
      propertyId: d.propertyId ?? null,
      followUpAt,
      ...(canAssign ? { assignedToId: d.assignedToId ?? null } : {}),
    },
  });

  const changes: string[] = [];
  if (enquiry.status !== d.status) changes.push(`status → ${ENQUIRY_STATUS_LABELS[d.status]}`);
  if (canAssign && enquiry.assignedToId !== (d.assignedToId ?? null)) changes.push("assignment changed");
  if (enquiry.propertyId !== (d.propertyId ?? null)) changes.push("property changed");
  if ((enquiry.followUpAt?.toISOString() ?? null) !== (followUpAt?.toISOString() ?? null)) changes.push("follow-up date changed");
  if (changes.length) {
    await logAudit({ userId: user.id, action: "enquiry.update", entity: "Enquiry", entityId: d.id, summary: changes.join(", ") });
  }
  revalidatePath(`/admin/enquiries/${d.id}`);
  return { ok: true, message: "Enquiry updated.", nonce: Date.now() };
}

export async function addEnquiryNote(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorise("enquiry.write");
  if (!user) return DENIED;
  const parsed = enquiryNoteSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const enquiry = await loadScoped(user, parsed.data.enquiryId);
  if (!enquiry) return DENIED;
  await db.enquiryNote.create({ data: { enquiryId: enquiry.id, authorId: user.id, body: parsed.data.body } });
  await logAudit({ userId: user.id, action: "enquiry.note", entity: "Enquiry", entityId: enquiry.id });
  revalidatePath(`/admin/enquiries/${enquiry.id}`);
  return { ok: true, message: "Note added.", nonce: Date.now() };
}

export async function deleteEnquiry(formData: FormData): Promise<void> {
  const user = await authorise("enquiry.delete");
  if (!user) redirect("/admin?denied=1");
  const id = String(formData.get("id") ?? "");
  const e = await db.enquiry.findUnique({ where: { id }, select: { name: true, type: true } });
  if (e) {
    await db.enquiry.delete({ where: { id } });
    // Record the deletion without copying personal data into the audit log.
    await logAudit({ userId: user.id, action: "enquiry.delete", entity: "Enquiry", entityId: id, summary: e.type });
  }
  redirect("/admin/enquiries?notice=deleted");
}
