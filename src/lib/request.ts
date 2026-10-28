import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";

/** Best-effort client IP. Render / Vercel / most proxies set x-forwarded-for. */
export function clientIp(): string {
  const h = headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Salted hash so raw IP addresses are never stored. */
export function hashedClientKey(): string {
  const salt = process.env.SESSION_SECRET ?? "dev-salt";
  return createHash("sha256").update(`${salt}:${clientIp()}`).digest("hex").slice(0, 32);
}

export function userAgent(): string | null {
  return headers().get("user-agent")?.slice(0, 250) ?? null;
}
