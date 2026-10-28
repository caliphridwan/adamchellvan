import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const KINDS = new Set(["whatsapp", "phone", "email"]);

/** Anonymous contact-click counter. Stores only the kind, page path and property id. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { kind?: unknown; path?: unknown; propertyId?: unknown };
    const kind = typeof body.kind === "string" && KINDS.has(body.kind) ? body.kind : null;
    if (!kind) return new NextResponse(null, { status: 204 });
    if (!(await rateLimit("contact-event", 60, 3600))) return new NextResponse(null, { status: 204 });
    const path = typeof body.path === "string" && /^\/[\w\-/]{0,150}$/.test(body.path) ? body.path : null;
    const propertyId = typeof body.propertyId === "string" && /^[a-z0-9]{10,40}$/.test(body.propertyId) ? body.propertyId : null;
    await db.contactEvent.create({ data: { kind, path, propertyId } });
  } catch {
    /* never error to the client */
  }
  return new NextResponse(null, { status: 204 });
}
