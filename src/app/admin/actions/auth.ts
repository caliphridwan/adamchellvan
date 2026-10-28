"use server";

import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import {
  createSession,
  destroyAllSessionsFor,
  destroySession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
  verifyPasswordConstantTime,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { changePasswordSchema, fieldErrors, formToObject, loginSchema, type FormState } from "@/lib/validation";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  if (!(await rateLimit("login", 8, 900))) {
    return { ok: false, message: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }
  const { email, password, next } = parsed.data;
  const user = await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true, isActive: true } });
  const valid = await verifyPasswordConstantTime(password, user?.passwordHash ?? null);
  if (!user || !valid || !user.isActive) {
    // Same message for every failure: no account enumeration.
    return { ok: false, message: "The email or password is incorrect." };
  }
  await createSession(user.id);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await logAudit({ userId: user.id, action: "auth.login", entity: "User", entityId: user.id });
  redirect(next ?? "/admin");
}

export async function logout(): Promise<void> {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await logAudit({ userId: user.id, action: "auth.logout", entity: "User", entityId: user.id });
  redirect("/admin/login");
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  const parsed = changePasswordSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const record = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record || !(await verifyPassword(parsed.data.currentPassword, record.passwordHash))) {
    return { ok: false, errors: { currentPassword: ["Current password is incorrect"] }, message: "Please correct the highlighted fields." };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });
  // Sign out every other device, then start a fresh session here.
  await destroyAllSessionsFor(user.id);
  await createSession(user.id);
  await logAudit({ userId: user.id, action: "user.password_change", entity: "User", entityId: user.id });
  return { ok: true, message: "Your password has been changed. Other devices have been signed out." };
}
