import type { Prisma } from "@prisma/client";
import { ENQUIRY_STATUSES, ENQUIRY_TYPES, type EnquiryStatusValue, type EnquiryTypeValue } from "./constants";
import { can, type RoleValue } from "./permissions";

export type EnquirySearch = { q?: string; status?: string; type?: string; assigned?: string; from?: string; to?: string };

/** Shared by the enquiry list and the CSV export so both apply identical filters and scoping. */
export function buildEnquiryWhere(s: EnquirySearch, user: { id: string; role: RoleValue }): Prisma.EnquiryWhereInput {
  const q = (s.q ?? "").trim().slice(0, 80);
  const where: Prisma.EnquiryWhereInput = {};
  const and: Prisma.EnquiryWhereInput[] = [];

  if (!can(user.role, "enquiry.readAll")) where.assignedToId = user.id;
  else if (s.assigned === "me") where.assignedToId = user.id;
  else if (s.assigned === "none") where.assignedToId = null;

  if (s.status && (ENQUIRY_STATUSES as readonly string[]).includes(s.status)) where.status = s.status as EnquiryStatusValue;
  else if (s.status === "open") where.status = { in: ["NEW", "CONTACTED", "QUALIFIED", "VIEWING_SCHEDULED"] };
  else where.status = { not: "SPAM" };

  if (s.type && (ENQUIRY_TYPES as readonly string[]).includes(s.type)) where.type = s.type as EnquiryTypeValue;

  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { property: { reference: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (s.from && dateRe.test(s.from)) and.push({ createdAt: { gte: new Date(`${s.from}T00:00:00Z`) } });
  if (s.to && dateRe.test(s.to)) and.push({ createdAt: { lte: new Date(`${s.to}T23:59:59Z`) } });
  if (and.length) where.AND = and;
  return where;
}
