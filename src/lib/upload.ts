import "server-only";
import { createHash } from "node:crypto";
import { db } from "./db";
import { detectFileType, DOCUMENT_TYPES, IMAGE_TYPES, type DetectedType } from "./file-type";

// Property media storage. Two back-ends, chosen automatically:
//  • Cloudinary (recommended at scale) — when the three CLOUDINARY_* variables are set.
//  • PostgreSQL (default, zero setup) — files stored in the StoredFile table and served at /media/<id>.
// Files are validated by magic bytes and size before being stored anywhere.

const DB_PREFIX = "db:";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
  );
}

/** Uploads always work: Cloudinary when configured, otherwise the database. */
export function isStorageConfigured(): boolean {
  return true;
}

function maxBytes(): number {
  const mb = Number(process.env.MAX_UPLOAD_MB ?? "8");
  return (Number.isFinite(mb) && mb > 0 ? mb : 8) * 1024 * 1024;
}

function sign(params: Record<string, string>): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + process.env.CLOUDINARY_API_SECRET).digest("hex");
}

export type UploadResult = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  type: DetectedType;
};

export class UploadError extends Error {}

export async function uploadFile(file: File, accept: "image" | "document", folder: string): Promise<UploadResult> {
  if (file.size === 0) throw new UploadError(`“${file.name}” is empty.`);
  if (file.size > maxBytes()) {
    throw new UploadError(`“${file.name}” is larger than ${Math.round(maxBytes() / 1024 / 1024)} MB.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const type = detectFileType(new Uint8Array(buffer.subarray(0, 16)));
  const allowed = accept === "image" ? IMAGE_TYPES : DOCUMENT_TYPES;
  if (!type || !allowed.includes(type)) {
    throw new UploadError(
      accept === "image"
        ? `“${file.name}” is not a JPEG, PNG or WebP image.`
        : `“${file.name}” is not a PDF document.`,
    );
  }

  if (!isCloudinaryConfigured()) {
    const stored = await db.storedFile.create({
      data: { mimeType: type, size: buffer.length, data: buffer },
      select: { id: true },
    });
    return { url: `/media/${stored.id}`, publicId: `${DB_PREFIX}${stored.id}`, type };
  }

  const resourceType = accept === "image" ? "image" : "raw";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const safeFolder = `${process.env.CLOUDINARY_FOLDER ?? "real-estate"}/${folder}`.replace(/[^a-zA-Z0-9/_-]/g, "");
  const params: Record<string, string> = { folder: safeFolder, timestamp };

  const form = new FormData();
  form.append("file", new Blob([buffer], { type }), accept === "image" ? "image" : "document.pdf");
  form.append("api_key", process.env.CLOUDINARY_API_KEY!);
  form.append("timestamp", timestamp);
  form.append("folder", safeFolder);
  form.append("signature", sign(params));

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: form, cache: "no-store" },
  );
  if (!res.ok) {
    console.error("[upload] provider responded", res.status);
    throw new UploadError("The media provider rejected the upload. Please try again.");
  }
  const json = (await res.json()) as { secure_url: string; public_id: string; width?: number; height?: number };
  return { url: json.secure_url, publicId: json.public_id, width: json.width, height: json.height, type };
}

export async function deleteFile(publicId: string, kind: "image" | "document"): Promise<void> {
  if (!publicId) return;
  if (publicId.startsWith(DB_PREFIX)) {
    await db.storedFile.delete({ where: { id: publicId.slice(DB_PREFIX.length) } }).catch(() => undefined);
    return;
  }
  if (!isCloudinaryConfigured()) return;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = { public_id: publicId, timestamp };
  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", process.env.CLOUDINARY_API_KEY!);
  form.append("timestamp", timestamp);
  form.append("signature", sign(params));
  const resourceType = kind === "image" ? "image" : "raw";
  try {
    await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`, {
      method: "POST",
      body: form,
      cache: "no-store",
    });
  } catch (err) {
    console.error("[upload] delete failed", (err as Error).message);
  }
}
