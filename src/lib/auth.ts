import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { can, type Permission, type RoleValue } from "./permissions";
import { userAgent } from "./request";

export const SESSION_COOKIE = "pe_session";
const SESSION_DAYS = 7;
const BCRYPT_COST = 12;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: RoleValue;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// A hash used to equalise timing when the email does not exist (prevents account enumeration).
let dummyHash: Promise<string> | null = null;
export async function verifyPasswordConstantTime(password: string, hash: string | null): Promise<boolean> {
  if (!hash) {
    dummyHash ??= bcrypt.hash("timing-equaliser", BCRYPT_COST);
    await bcrypt.compare(password, await dummyHash);
    return false;
  }
  return bcrypt.compare(password, hash);
}

/** Creates a DB session and sets the httpOnly cookie. Call only from a Server Action or Route Handler. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt, userAgent: userAgent() },
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookies().delete(SESSION_COOKIE);
}

export async function destroyAllSessionsFor(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}

/** Returns the signed-in staff user, or null. Memoised per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true, role: true, isActive: true } } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date() || !session.user.isActive) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  const { id, email, name, role } = session.user;
  return { id, email, name, role };
});

/** Server-side gate for admin pages and actions. Redirects to login when signed out. */
export async function requireUser(permission: Permission = "dashboard.view"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, permission)) redirect("/admin?denied=1");
  return user;
}

/** Variant for Server Actions that should return an error instead of redirecting on missing permission. */
export async function authorise(permission: Permission): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, permission)) return null;
  return user;
}
