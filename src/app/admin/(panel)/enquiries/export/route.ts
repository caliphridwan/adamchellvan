import { NextResponse, type NextRequest } from "next/server";
import { logAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import { ENQUIRY_STATUS_LABELS, ENQUIRY_TYPE_LABELS } from "@/lib/constants";
import { toCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { buildEnquiryWhere, type EnquirySearch } from "@/lib/enquiry-filters";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const MAX_ROWS = 10_000;

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(user.role, "enquiry.export")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const search: EnquirySearch = {};
  for (const k of ["q", "status", "type", "assigned", "from", "to"] as const) {
    const v = sp.get(k);
    if (v) search[k] = v.slice(0, 80);
  }
  const where = buildEnquiryWhere(search, user);
  const rows = await db.enquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    select: {
      createdAt: true,
      type: true,
      status: true,
      name: true,
      email: true,
      phone: true,
      message: true,
      preferredDate: true,
      preferredTime: true,
      followUpAt: true,
      submissionData: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      landingPage: true,
      property: { select: { reference: true, title: true } },
      assignedTo: { select: { name: true } },
    },
  });

  const csv = toCsv(
    ["Received", "Type", "Status", "Name", "Email", "Phone", "Property ref", "Property", "Preferred date", "Preferred time", "Follow up", "Assigned to", "Source", "Medium", "Campaign", "Landing page", "Details", "Message"],
    rows.map((r) => [
      r.createdAt,
      ENQUIRY_TYPE_LABELS[r.type],
      ENQUIRY_STATUS_LABELS[r.status],
      r.name,
      r.email,
      r.phone,
      r.property?.reference,
      r.property?.title,
      r.preferredDate?.toISOString().slice(0, 10),
      r.preferredTime,
      r.followUpAt?.toISOString().slice(0, 10),
      r.assignedTo?.name,
      r.utmSource,
      r.utmMedium,
      r.utmCampaign,
      r.landingPage,
      r.submissionData && typeof r.submissionData === "object" && !Array.isArray(r.submissionData)
        ? Object.entries(r.submissionData as Record<string, unknown>)
            .filter(([k, v]) => k !== "photos" && v !== null && v !== "")
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join("/") : String(v)}`)
            .join("; ")
        : "",
      r.message,
    ]),
  );

  await logAudit({ userId: user.id, action: "enquiry.export", entity: "Enquiry", summary: `${rows.length} rows`, meta: { filters: { ...search } } });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="enquiries-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
