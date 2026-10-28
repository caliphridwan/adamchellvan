import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

/** Serves files stored in PostgreSQL (used when Cloudinary is not configured). Content never changes, so it is cached hard. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!/^[a-z0-9]{10,40}$/.test(params.id)) return new NextResponse("Not found", { status: 404 });
  const file = await db.storedFile.findUnique({ where: { id: params.id }, select: { mimeType: true, size: true, data: true } });
  if (!file || !ALLOWED.has(file.mimeType)) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(file.data, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(file.mimeType === "application/pdf" ? { "Content-Disposition": "inline" } : {}),
    },
  });
}
