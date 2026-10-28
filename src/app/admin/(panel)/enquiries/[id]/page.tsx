import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { addEnquiryNote, deleteEnquiry, updateEnquiry } from "@/app/admin/actions/enquiries";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { EntityForm } from "@/components/admin/EntityForm";
import { Card, EnquiryStatusPill, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS, ENQUIRY_TYPE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { formatDate, telLink, whatsappLink } from "@/lib/utils";

export const metadata: Metadata = { title: "Enquiry" };

export default async function EnquiryDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser("enquiry.read");
  const enquiry = await db.enquiry.findUnique({
    where: { id: params.id },
    include: {
      property: { select: { id: true, title: true, reference: true, slug: true, isPublished: true } },
      assignedTo: { select: { id: true, name: true } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!enquiry) notFound();
  if (!can(user.role, "enquiry.readAll") && enquiry.assignedToId !== user.id) notFound();

  const [staff, properties, history] = await Promise.all([
    can(user.role, "enquiry.assign")
      ? db.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, role: true } })
      : Promise.resolve([]),
    db.property.findMany({ orderBy: { updatedAt: "desc" }, take: 300, select: { id: true, title: true, reference: true } }),
    db.auditLog.findMany({
      where: { entity: "Enquiry", entityId: enquiry.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const submission = enquiry.submissionData && typeof enquiry.submissionData === "object" && !Array.isArray(enquiry.submissionData)
    ? (enquiry.submissionData as Record<string, unknown>)
    : null;
  const photos =
    submission && Array.isArray(submission.photos)
      ? (submission.photos as unknown[]).filter((u): u is string => typeof u === "string" && (u.startsWith("https://res.cloudinary.com/") || /^\/media\/[a-z0-9]+$/.test(u)))
      : [];
  const tel = telLink(enquiry.phone);
  const wa = whatsappLink(enquiry.phone);

  return (
    <>
      <PageHeader
        title={enquiry.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {ENQUIRY_TYPE_LABELS[enquiry.type]} · received {formatDate(enquiry.createdAt, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            <EnquiryStatusPill status={enquiry.status} />
          </span>
        }
        back={{ href: "/admin/enquiries", label: "Enquiries" }}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="Message">
            <p className="whitespace-pre-line leading-relaxed text-charcoal-700">{enquiry.message}</p>
            {enquiry.preferredDate ? (
              <p className="mt-4 rounded bg-ivory-100 px-4 py-3 text-sm">
                <strong>Preferred viewing:</strong> {formatDate(enquiry.preferredDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                {enquiry.preferredTime ? ` · ${enquiry.preferredTime}` : ""}
              </p>
            ) : null}
            {submission ? (
              <dl className="mt-4 grid gap-2 rounded bg-ivory-100 px-4 py-3 text-sm sm:grid-cols-2">
                {Object.entries(submission)
                  .filter(([k]) => k !== "photos")
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs uppercase tracking-[0.12em] text-charcoal-500">{k.replace(/([A-Z])/g, " $1")}</dt>
                      <dd className="text-navy-900">
                        {v === null || v === undefined || v === "" ? "—" : Array.isArray(v) ? v.join(", ") : String(v)}
                      </dd>
                    </div>
                  ))}
              </dl>
            ) : null}
            {photos.length ? (
              <div className="mt-4">
                <p className="field-label">Photos submitted ({photos.length})</p>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {photos.map((url, i) => (
                    <li key={url} className="relative aspect-[4/3] overflow-hidden rounded-sm bg-ivory-200">
                      <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open photo ${i + 1}`}>
                        <Image src={url} alt={`Submitted photo ${i + 1}`} fill sizes="200px" className="object-cover" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {enquiry.source ? <p className="mt-4 text-xs text-charcoal-500">Submitted from {enquiry.source}</p> : null}
          </Card>

          <Card title="Internal notes">
            <EntityForm
              action={addEnquiryNote}
              idPrefix="note"
              resetOnSuccess
              submitLabel="Add note"
              values={{ enquiryId: enquiry.id }}
              sections={[{ fields: [{ type: "hidden", name: "enquiryId" }, { type: "textarea", name: "body", label: "New note", rows: 3, required: true }] }]}
            />
            {enquiry.notes.length ? (
              <ul className="mt-6 space-y-4">
                {enquiry.notes.map((n) => (
                  <li key={n.id} className="border-l-2 border-champagne-400 pl-4">
                    <p className="whitespace-pre-line text-sm text-charcoal-700">{n.body}</p>
                    <p className="mt-1 text-xs text-charcoal-500">{n.author?.name ?? "Former staff member"} · {formatDate(n.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>

          {history.length ? (
            <Card title="Activity">
              <ul className="space-y-2 text-sm">
                {history.map((h) => (
                  <li key={h.id} className="flex flex-wrap justify-between gap-2">
                    <span>{h.user?.name ?? "System"} — {h.summary ?? h.action}</span>
                    <span className="text-xs text-charcoal-500">{formatDate(h.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-6">
          <Card title="Contact">
            <dl className="space-y-3 text-sm">
              <div><dt className="field-label">Email</dt><dd><a href={`mailto:${enquiry.email}`} className="break-all text-navy-900 underline">{enquiry.email}</a></dd></div>
              <div><dt className="field-label">Phone</dt><dd>{tel ? <a href={tel} className="text-navy-900 underline">{enquiry.phone}</a> : "—"}</dd></div>
              {wa ? <div><a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm w-full">Open WhatsApp</a></div> : null}
              <div><dt className="field-label">Consent to contact</dt><dd>{enquiry.consentToContact ? "Yes" : "No"}</dd></div>
              <div>
                <dt className="field-label">Lead source</dt>
                <dd>
                  {enquiry.utmSource ? `${enquiry.utmSource}${enquiry.utmMedium ? ` / ${enquiry.utmMedium}` : ""}` : "Direct / unknown"}
                  {enquiry.utmCampaign ? <span className="block text-xs text-charcoal-500">Campaign: {enquiry.utmCampaign}</span> : null}
                  {enquiry.landingPage ? <span className="block text-xs text-charcoal-500">Landed on {enquiry.landingPage}</span> : null}
                </dd>
              </div>
            </dl>
            {enquiry.property ? (
              <div className="mt-5 border-t border-ivory-200 pt-4 text-sm">
                <p className="field-label">Property</p>
                <Link href={`/admin/properties/${enquiry.property.id}`} className="font-medium text-navy-900 hover:underline">
                  {enquiry.property.title}
                </Link>
                <p className="text-xs text-charcoal-500">{enquiry.property.reference}</p>
              </div>
            ) : null}
          </Card>

          <Card title="Manage">
            <EntityForm
              action={updateEnquiry}
              submitLabel="Update"
              values={{
                id: enquiry.id,
                status: enquiry.status,
                assignedToId: enquiry.assignedToId ?? "",
                propertyId: enquiry.propertyId ?? "",
                followUpAt: enquiry.followUpAt ? enquiry.followUpAt.toISOString().slice(0, 10) : "",
              }}
              sections={[
                {
                  fields: [
                    { type: "hidden", name: "id" },
                    { type: "select", name: "status", label: "Status", options: ENQUIRY_STATUSES.map((s) => ({ value: s, label: ENQUIRY_STATUS_LABELS[s] })) },
                    ...(can(user.role, "enquiry.assign")
                      ? [{ type: "select" as const, name: "assignedToId", label: "Assigned to", placeholder: "Unassigned", options: staff.map((s) => ({ value: s.id, label: `${s.name} (${ROLE_LABELS[s.role]})` })) }]
                      : []),
                    { type: "select", name: "propertyId", label: "Related property", placeholder: "None", options: properties.map((p) => ({ value: p.id, label: `${p.reference} — ${p.title}` })) },
                    { type: "date", name: "followUpAt", label: "Follow-up date" },
                  ],
                },
              ]}
            />
          </Card>

          {can(user.role, "enquiry.delete") ? (
            <Card title="Delete">
              <p className="mb-3 text-sm text-charcoal-500">Permanently remove this enquiry and its notes, e.g. on a data-deletion request.</p>
              <form action={deleteEnquiry}>
                <input type="hidden" name="id" value={enquiry.id} />
                <ConfirmSubmit label="Delete enquiry" confirmLabel="Delete" className="btn-outline btn-sm w-full text-danger" />
              </form>
            </Card>
          ) : null}
        </aside>
      </div>
    </>
  );
}
