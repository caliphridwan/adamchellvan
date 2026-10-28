"use client";

import { useFormState } from "react-dom";
import { submitListing } from "@/app/actions/public";
import { SUBMITTER_ROLES, TRANSACTION_TYPES } from "@/lib/constants";
import { AttributionFields, track } from "./analytics";
import { useEffect } from "react";
import { initialFormState } from "@/lib/validation";
import {
  CheckboxField,
  FormMessage,
  FieldError,
  Honeypot,
  PhoneField,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from "@/components/ui/form";

export function ListingSubmissionForm({ photosEnabled }: { photosEnabled: boolean }) {
  const [state, action] = useFormState(submitListing, initialFormState);
  useEffect(() => {
    if (state.ok) track("Listing Submitted");
  }, [state.ok]);
  if (state.ok) {
    return (
      <div role="status" className="py-6 text-center">
        <p className="font-display text-3xl text-navy-900">Thank you</p>
        <p className="mx-auto mt-3 max-w-md text-charcoal-700">{state.message}</p>
      </div>
    );
  }
  return (
    <form action={action} className="relative space-y-6" noValidate>
      <FormMessage state={state} />
      <fieldset className="space-y-5">
        <legend className="mb-2 font-display text-2xl text-navy-900">Your details</legend>
        <SelectField
          name="submitterRole"
          label="I am the"
          required
          placeholder="Choose…"
          options={SUBMITTER_ROLES.map((r) => ({ value: r, label: r }))}
          state={state}
        />
        <TextField name="name" label="Full name" autoComplete="name" required state={state} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="email" type="email" label="Email" autoComplete="email" required state={state} />
          <PhoneField required state={state} />
        </div>
      </fieldset>
      <fieldset className="space-y-5 border-t border-ivory-200 pt-6">
        <legend className="mb-2 font-display text-2xl text-navy-900">The property</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            name="transactionType"
            label="I'd like to"
            required
            placeholder="Choose…"
            options={TRANSACTION_TYPES.map((t) => ({
              value: t,
              label: t === "SALE" ? "Sell" : t === "RENT" ? "Rent out" : "Lease",
            }))}
            state={state}
          />
          <TextField name="propertyType" label="Property type" placeholder="e.g. 4-bedroom detached house" required state={state} />
        </div>
        <TextField name="location" label="Location / area" hint="General area only — no need for the full address yet." required state={state} />
        <TextField name="askingPrice" label="Asking price (optional)" state={state} />
        <TextAreaField
          name="details"
          label="Property details"
          rows={6}
          required
          hint="Size, condition, title documents, availability and anything else we should know."
          state={state}
        />
        {photosEnabled ? (
          <div>
            <label htmlFor="f-photos" className="field-label">Photographs (optional)</label>
            <input
              id="f-photos"
              name="photos"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              aria-describedby="f-photos-hint"
              className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-navy-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ivory-50"
            />
            <p id="f-photos-hint" className="field-hint">Up to 6 JPEG, PNG or WebP photos, 10 MB in total. Please don't upload title documents here — we'll arrange a secure way to review them.</p>
            <FieldError id="f-photos" errors={state.errors?.photos} />
          </div>
        ) : (
          <p className="text-xs text-charcoal-500">Photos and documents can be shared once our team contacts you.</p>
        )}
      </fieldset>
      <CheckboxField
        name="consent"
        label="I confirm I am the owner or am authorised to market this property, and I agree to be contacted about this submission."
        required
        state={state}
      />
      <AttributionFields />
      <Honeypot />
      <SubmitButton className="btn-primary w-full sm:w-auto">Submit property</SubmitButton>
    </form>
  );
}
