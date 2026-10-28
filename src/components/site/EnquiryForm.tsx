"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { submitEnquiry } from "@/app/actions/public";
import { initialFormState } from "@/lib/validation";
import { VIEWING_TIMES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  CheckboxField,
  FormMessage,
  Honeypot,
  PhoneField,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from "@/components/ui/form";
import { AttributionFields, track } from "./analytics";

type Mode = "PROPERTY" | "VIEWING";

/** Enquiry + viewing request form used on property detail pages. */
export function PropertyEnquiryForm({ propertyId, propertyTitle, source }: { propertyId: string; propertyTitle: string; source: string }) {
  const [mode, setMode] = useState<Mode>("PROPERTY");
  return (
    <div>
      <div role="tablist" aria-label="Enquiry type" className="mb-6 grid grid-cols-2 rounded border border-ivory-300 p-1">
        {(
          [
            ["PROPERTY", "Enquire"],
            ["VIEWING", "Request inspection"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`tab-${value}`}
            aria-selected={mode === value}
            aria-controls={`panel-${value}`}
            onClick={() => setMode(value)}
            className={cn(
              "min-h-[40px] rounded-sm text-xs font-semibold uppercase tracking-[0.12em] transition-colors",
              mode === value ? "bg-navy-900 text-ivory-50" : "text-charcoal-700 hover:bg-ivory-100",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${mode}`} aria-labelledby={`tab-${mode}`}>
        {/* key forces a fresh form state when switching mode */}
        <EnquiryFormInner
          key={mode}
          type={mode}
          propertyId={propertyId}
          source={source}
          defaultMessage={
            mode === "VIEWING"
              ? `I would like to arrange an inspection of “${propertyTitle}”.`
              : `I'm interested in “${propertyTitle}” and would like more information.`
          }
        />
      </div>
    </div>
  );
}

export function EnquiryFormInner({
  type,
  propertyId,
  source,
  defaultMessage,
  showTypeSelect,
  defaultType,
  showPropertyReference,
  defaultReference,
  showRemoteOption,
}: {
  type?: "GENERAL" | "PROPERTY" | "VIEWING" | "CONSULTATION";
  propertyId?: string;
  source: string;
  defaultMessage?: string;
  showTypeSelect?: boolean;
  defaultType?: string;
  showPropertyReference?: boolean;
  defaultReference?: string;
  showRemoteOption?: boolean;
}) {
  const [state, action] = useFormState(submitEnquiry, initialFormState);
  const [minDate, setMinDate] = useState<string>("");

  useEffect(() => {
    const d = new Date();
    setMinDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }, []);

  useEffect(() => {
    if (state.ok) track(type === "VIEWING" ? "Viewing Requested" : "Enquiry Submitted", { type: type ?? "GENERAL" });
  }, [state.ok, type]);

  if (state.ok) {
    return (
      <div role="status" className="rounded border border-success/25 bg-success/5 p-6">
        <p className="font-display text-2xl text-navy-900">Thank you</p>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-700">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="relative space-y-5" noValidate>
      <FormMessage state={state} />
      {showTypeSelect ? (
        <SelectField
          name="type"
          label="Enquiry type"
          state={state}
          defaultValue={defaultType ?? "GENERAL"}
          options={[
            { value: "GENERAL", label: "General enquiry" },
            { value: "PROPERTY", label: "About a specific property" },
            { value: "CONSULTATION", label: "Book a consultation" },
          ]}
        />
      ) : (
        <input type="hidden" name="type" value={type ?? "GENERAL"} />
      )}
      {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}
      <input type="hidden" name="source" value={source} />

      <TextField name="name" label="Full name" autoComplete="name" required state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="email" type="email" label="Email" autoComplete="email" required state={state} />
        <PhoneField state={state} />
      </div>
      {showPropertyReference ? (
        <TextField
          name="propertyReference"
          label="Property reference (optional)"
          hint="Shown on each listing, e.g. PE-2026-0012"
          defaultValue={defaultReference}
          state={state}
        />
      ) : null}
      {type === "VIEWING" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="preferredDate" type="date" label="Preferred inspection date" min={minDate || undefined} required state={state} />
          <SelectField
            name="preferredTime"
            label="Preferred time"
            placeholder="Any time"
            options={VIEWING_TIMES.map((t) => ({ value: t, label: t }))}
            state={state}
          />
        </div>
      ) : null}
      <TextAreaField name="message" label="Message" rows={4} required defaultValue={defaultMessage} state={state} />
      {showRemoteOption || type === "VIEWING" ? (
        <CheckboxField
          name="remoteConsultation"
          label={type === "VIEWING" ? "I'm abroad / can't attend — please arrange a remote (video) inspection" : "I'd prefer a remote consultation (video or phone call)"}
          state={state}
        />
      ) : null}
      <CheckboxField
        name="consent"
        label="I agree that my details may be used to respond to this enquiry, as described in the privacy policy."
        required
        state={state}
      />
      <AttributionFields />
      <Honeypot />
      <SubmitButton className="btn-primary w-full">
        {type === "VIEWING" ? "Request inspection" : "Send enquiry"}
      </SubmitButton>
    </form>
  );
}
