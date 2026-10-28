import "server-only";
import { db } from "./db";
import { hashedClientKey } from "./request";

/**
 * Database-backed sliding-window limiter (works across multiple app instances).
 * Returns true when the request is allowed.
 */
export async function rateLimit(action: string, limit: number, windowSeconds: number): Promise<boolean> {
  const key = `${action}:${hashedClientKey()}`;
  const since = new Date(Date.now() - windowSeconds * 1000);
  try {
    const count = await db.rateLimitHit.count({ where: { key, createdAt: { gte: since } } });
    if (count >= limit) return false;
    await db.rateLimitHit.create({ data: { key } });
    // Opportunistic clean-up of old rows.
    if (Math.random() < 0.02) {
      await db.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } } });
    }
    return true;
  } catch (err) {
    console.error("[rate-limit] check failed", (err as Error).message);
    // Fail open for availability; forms still have honeypot + validation.
    return true;
  }
}
