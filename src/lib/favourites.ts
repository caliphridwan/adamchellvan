export const FAVOURITES_COOKIE = "pe_saved";

/** Parses the saved-properties cookie, keeping only id-shaped values (max 50). */
export function parseFavourites(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => /^[a-z0-9]{10,40}$/.test(s)),
    ),
  ).slice(0, 50);
}
