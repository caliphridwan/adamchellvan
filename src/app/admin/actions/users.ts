"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { authorise, destroyAllSessionsFor, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { fieldErrors, formToObject, userCreateSchema, userUpdateSchema, type FormState } from "@/lib/validation";

const DENIED: FormState = { ok: false, message: "You don't have permission to do that." };

export async function createUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await authorise("user.manage");
  if (!admin) return DENIED;
  const parsed = userCreateSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const d = parsed.data;
  if (await db.user.findUnique({ where: { email: d.email }, select: { id: true } })) {
    return { ok: false, errors: { email: ["A user with this email already exists"] }, message: "Please correct the highlighted fields." };
  }
  const user = await db.user.create({
    data: { name: d.name, email: d.email, role: d.role, passwordHash: await hashPassword(d.password) },
    select: { id: true },
  });
  await logAudit({ userId: admin.id, action: "user.create", entity: "User", entityId: user.id, summary: `${d.name} (${d.role})` });
  revalidatePath("/admin/users");
  return { ok: true, message: `${d.name} can now sign in. Share the temporary password securely and ask them to change it.`, nonce: Date.now() };
}

export async function updateUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await authorise("user.manage");
  if (!admin) return DENIED;
  const parsed = userUpdateSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const d = parsed.data;
  const target = await db.user.findUnique({ where: { id: d.id }, select: { id: true, role: true, isActive: true } });
  if (!target) return { ok: false, message: "User not found." };

  // Safeguards: never lock out the last active administrator, and admins can't demote/deactivate themselves.
  const losingAdmin = target.role === "ADMIN" && target.isActive && (d.role !== "ADMIN" || !d.isActive);
  if (losingAdmin) {
    if (target.id === admin.id) return { ok: false, message: "You can't remove your own administrator access." };
    const otherAdmins = await db.user.count({ where: { role: "ADMIN", isActive: true, id: { not: target.id } } });
    if (!otherAdmins) return { ok: false, message: "At least one active administrator is required." };
  }

  await db.user.update({
    where: { id: d.id },
    data: {
      name: d.name,
      role: d.role,
      isActive: d.isActive,
      ...(d.newPassword ? { passwordHash: await hashPassword(d.newPassword) } : {}),
    },
  });
  if (!d.isActive || d.newPassword || d.role !== target.role) await destroyAllSessionsFor(d.id);
  await logAudit({
    userId: admin.id,
    action: "user.update",
    entity: "User",
    entityId: d.id,
    summary: [`role ${d.role}`, d.isActive ? "active" : "deactivated", d.newPassword ? "password reset" : null].filter(Boolean).join(", "),
  });
  revalidatePath("/admin/users");
  return { ok: true, message: "User updated.", nonce: Date.now() };
}
