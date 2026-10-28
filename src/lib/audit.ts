import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";

export async function logAudit(entry: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  summary?: string;
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        summary: entry.summary?.slice(0, 300),
        meta: entry.meta,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record", entry.action, (err as Error).message);
  }
}
