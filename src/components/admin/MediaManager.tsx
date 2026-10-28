"use client";

import Image from "next/image";
import { useRef } from "react";
import { useFormState } from "react-dom";
import { updateMedia, uploadMedia } from "@/app/admin/actions/properties";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { initialFormState } from "@/lib/validation";
import { ActionButton, ConfirmSubmit } from "./ConfirmSubmit";

type Media = { id: string; kind: "IMAGE" | "FLOOR_PLAN" | "BROCHURE"; url: string; alt: string | null };

const KIND_LABELS = { IMAGE: "Photos", FLOOR_PLAN: "Floor plans", BROCHURE: "Brochures (PDF)" } as const;

export function MediaManager({ propertyId, media, canWrite, storageReady }: { propertyId: string; media: Media[]; canWrite: boolean; storageReady: boolean }) {
  const [state, action] = useFormState(uploadMedia, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const groups = (["IMAGE", "FLOOR_PLAN", "BROCHURE"] as const).map((k) => ({ kind: k, items: media.filter((m) => m.kind === k) }));

  return (
    <div className="space-y-6">
      {canWrite ? (
        storageReady ? (
          <form
            ref={formRef}
            key={state.nonce ?? 0}
            action={action}
            className="space-y-3 rounded border border-dashed border-ivory-300 p-4"
          >
            <FormMessage state={state} />
            <input type="hidden" name="propertyId" value={propertyId} />
            <div>
              <label htmlFor="media-kind" className="field-label">Type</label>
              <select id="media-kind" name="kind" className="field" defaultValue="IMAGE">
                <option value="IMAGE">Photos (JPEG, PNG, WebP)</option>
                <option value="FLOOR_PLAN">Floor plan images</option>
                <option value="BROCHURE">Brochure (PDF)</option>
              </select>
            </div>
            <div>
              <label htmlFor="media-files" className="field-label">Files</label>
              <input id="media-files" name="files" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-navy-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ivory-50" />
              <p className="field-hint">Up to 20 files at once. Large photos are optimised automatically.</p>
            </div>
            <SubmitButton className="btn-primary btn-sm w-full" pendingLabel="Uploading…">Upload</SubmitButton>
          </form>
        ) : (
          <p className="rounded bg-ivory-100 px-3 py-2 text-xs text-charcoal-700">
            Uploads are currently unavailable.
          </p>
        )
      ) : null}

      {groups.map((g) =>
        g.items.length ? (
          <div key={g.kind}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal-500">
              {KIND_LABELS[g.kind]} ({g.items.length})
            </h3>
            <ul className="space-y-3">
              {g.items.map((m, i) => (
                <li key={m.id} className="rounded border border-ivory-200 p-2">
                  <div className="flex gap-3">
                    {m.kind === "BROCHURE" ? (
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex h-14 w-20 shrink-0 items-center justify-center rounded-sm bg-ivory-200 text-xs font-semibold">PDF</a>
                    ) : (
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-sm bg-ivory-200">
                        <Image src={m.url} alt={m.alt ?? ""} fill sizes="80px" className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {g.kind === "IMAGE" && i === 0 ? <span className="badge bg-champagne-300 text-navy-950">Cover</span> : null}
                      {canWrite ? (
                        <form action={updateMedia} className="mt-1 flex gap-1">
                          <input type="hidden" name="mediaId" value={m.id} />
                          <input type="hidden" name="intent" value="alt" />
                          <label htmlFor={`alt-${m.id}`} className="sr-only">{m.kind === "BROCHURE" ? "Label" : "Alt text"}</label>
                          <input id={`alt-${m.id}`} name="alt" defaultValue={m.alt ?? ""} placeholder={m.kind === "BROCHURE" ? "Label" : "Describe the image"} className="field min-h-[32px] py-1 text-xs" />
                          <ActionButton className="btn-ghost btn-sm px-2 text-xs">Save</ActionButton>
                        </form>
                      ) : (
                        <p className="truncate text-xs text-charcoal-500">{m.alt}</p>
                      )}
                    </div>
                  </div>
                  {canWrite ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {i > 0 ? (
                        <>
                          <MediaIntent id={m.id} intent="up" label="↑ Up" />
                          {g.kind === "IMAGE" ? <MediaIntent id={m.id} intent="first" label="Make cover" /> : null}
                        </>
                      ) : null}
                      {i < g.items.length - 1 ? <MediaIntent id={m.id} intent="down" label="↓ Down" /> : null}
                      <form action={updateMedia}>
                        <input type="hidden" name="mediaId" value={m.id} />
                        <input type="hidden" name="intent" value="delete" />
                        <ConfirmSubmit label="Remove" confirmLabel="Remove" message="Delete this file?" className="btn-ghost btn-sm px-2 text-xs text-danger" />
                      </form>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
      {!media.length ? <p className="text-sm text-charcoal-500">No media yet.</p> : null}
    </div>
  );
}

function MediaIntent({ id, intent, label }: { id: string; intent: string; label: string }) {
  return (
    <form action={updateMedia}>
      <input type="hidden" name="mediaId" value={id} />
      <input type="hidden" name="intent" value={intent} />
      <ActionButton className="btn-ghost btn-sm px-2 text-xs">{label}</ActionButton>
    </form>
  );
}
