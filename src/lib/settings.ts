import "server-only";
import { cache } from "react";
import type { SiteSettings } from "@prisma/client";
import { db } from "./db";
import { PLACEHOLDER } from "./constants";

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const existing = await db.siteSettings.findUnique({ where: { id: "site" } });
  if (existing) return existing;
  // First run before seeding: create the row with placeholder defaults.
  return db.siteSettings.upsert({
    where: { id: "site" },
    update: {},
    create: { id: "site", companyName: PLACEHOLDER.companyName },
  });
});

/** Fields an administrator should complete before launch (shown on the dashboard). */
export function missingSettings(s: SiteSettings): string[] {
  const checks: [string, string | null][] = [
    ["Company name", s.companyName?.startsWith("[") ? null : s.companyName],
    ["Logo URL", s.logoUrl],
    ["Hero photograph", s.heroImageUrl],
    ["Phone number", s.phone],
    ["WhatsApp number", s.whatsapp],
    ["Email address", s.email],
    ["Office address", s.officeAddress],
    ["Hero headline", s.heroHeadline],
    ["Company introduction", s.introBody],
    ["About-page story", s.aboutStory && !s.aboutStory.includes("[ADD") ? s.aboutStory : null],
    ["Mission", s.mission?.startsWith("[") ? null : s.mission],
    ["Vision", s.vision?.startsWith("[") ? null : s.vision],
    ["Business hours", s.businessHours],
  ];
  return checks.filter(([, v]) => !v || !v.trim()).map(([label]) => label);
}
