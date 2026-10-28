"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { submitInvestor, submitRequirement } from "@/app/actions/public";
import {
  BUDGET_CURRENCIES,
  CONTACT_METHODS,
  INTENDED_USES,
  INVESTMENT_OBJECTIVES,
  PURCHASE_TIMELINES,
} from "@/lib/constants";
import { initialFormState, type FormState } from "@/lib/validation";
import {
  CheckboxField,
  FieldError,
  FormMessage,
  Honeypot,
  PhoneField,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from "@/components/ui/form";
import { AttributionFields, track } from "./analytics";

function Success({ message }: { message?: string }) {
  return (
    <div role="status" className="rounded border border-success/25 bg-success/5 p-6">
      <p className="font-display text-2xl text-navy-900">Thank you</p>
      <p className="mt-2 text-sm leading-relaxed text-charcoal-700">{message}</p>
    </div>
  );
}

function BudgetField({ idPrefix, state: s, label }: { idPrefix: string; state: FormState; label: string }) {
  return (
    <div>
      <label htmlFor={`${idPrefix}-budget`} className="field-label">
        {label} <span className="text-danger">*</span>
      </label>
      <div className="flex gap-2">
        <label htmlFor={`${idPrefix}-budgetCurrency`} className="sr-only">Currency</label>
        <select id={`${idPrefix}-budgetCurrency`} name="budgetCurrency" defaultValue="NGN" className="field w-[6rem] shrink-0 px-2 text-sm">
          {BUDGET_CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          id={`${idPrefix}-budget`}
          name="budget"
          required
          placeholder="e.g. 80m – 120m"
          aria-invalid={s.errors?.budget?.length ? true : undefined}
          aria-describedby={s.errors?.budget?.length ? `${idPrefix}-budget-error` : undefined}
          className="field min-w-0 flex-1"
        />
      </div>
      <FieldError id={`${idPrefix}-budget`} errors={s.errors?.budget} />
    </div>
  );
}

/** "Tell us what you need" — captures buyers and tenants even when no listing matches yet. */
export function RequirementForm({ idPrefix = "req", compact = false }: { idPrefix?: string; compact?: boolean }) {
  const [state, action] = useFormState(submitRequirement, initialFormState);
  useEffect(() => {
    if (state.ok) track("Requirement Submitted");
  }, [state.ok]);
  if (state.ok) return <Success message={state.message} />;

  return (
    <form action={action} className="relative space-y-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          idPrefix={idPrefix}
          name="transactionType"
          label="I want to"
          required
          placeholder="Choose…"
          options={[
            { value: "SALE", label: "Buy" },
            { value: "RENT", label: "Rent" },
            { value: "LEASE", label: "Lease" },
          ]}
          state={state}
        />
        <TextField idPrefix={idPrefix} name="propertyType" label="Property type" placeholder="e.g. 4-bed duplex, land, office" required state={state} />
        <TextField idPrefix={idPrefix} name="preferredLocation" label="Preferred location" placeholder="e.g. Lekki, Ikoyi, Ikeja GRA" required state={state} />
        <BudgetField idPrefix={idPrefix} state={state} label="Budget" />
        {!compact ? (
          <>
            <TextField idPrefix={idPrefix} name="bedrooms" type="number" min={0} label="Bedrooms (if applicable)" state={state} />
            <SelectField idPrefix={idPrefix} name="intendedUse" label="Intended use" placeholder="Choose…" options={INTENDED_USES.map((u) => ({ value: u, label: u }))} state={state} />
          </>
        ) : null}
        <SelectField idPrefix={idPrefix} name="timeline" label="Timeline" required placeholder="Choose…" options={PURCHASE_TIMELINES.map((t) => ({ value: t, label: t }))} state={state} />
        <TextField idPrefix={idPrefix} name="name" label="Full name" autoComplete="name" required state={state} />
        <TextField idPrefix={idPrefix} name="email" type="email" label="Email" autoComplete="email" required state={state} />
        <PhoneField idPrefix={idPrefix} required state={state} />
      </div>
      <TextAreaField idPrefix={idPrefix} name="message" label="Anything else we should know?" rows={3} state={state} />
      <CheckboxField
        idPrefix={idPrefix}
        name="consent"
        label="I agree that my details may be used to respond to this request, as described in the privacy policy."
        required
        state={state}
      />
      <AttributionFields />
      <Honeypot />
      <SubmitButton className="btn-primary w-full sm:w-auto">Send my requirements</SubmitButton>
    </form>
  );
}

/** International / diaspora investor enquiry with time-zone capture for remote consultations. */
export function InvestorForm({ idPrefix = "inv" }: { idPrefix?: string }) {
  const [state, action] = useFormState(submitInvestor, initialFormState);
  const [timeZone, setTimeZone] = useState("");
  useEffect(() => {
    try {
      setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "");
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    if (state.ok) track("Investor Enquiry");
  }, [state.ok]);
  if (state.ok) return <Success message={state.message} />;

  return (
    <form action={action} className="relative space-y-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField idPrefix={idPrefix} name="name" label="Full name" autoComplete="name" required state={state} />
        <TextField idPrefix={idPrefix} name="email" type="email" label="Email" autoComplete="email" required state={state} />
        <TextField idPrefix={idPrefix} name="countryOfResidence" label="Country of residence" autoComplete="country-name" required state={state} />
        <PhoneField idPrefix={idPrefix} state={state} defaultCountry="+44" hint="Include WhatsApp if you prefer it." />
        <TextField idPrefix={idPrefix} name="preferredMarket" label="Preferred Nigerian market" placeholder="e.g. Lagos — Lekki / Ikoyi; Abuja" required state={state} />
        <BudgetField idPrefix={idPrefix} state={state} label="Budget range" />
      </div>
      <fieldset>
        <legend className="field-label">
          Investment objectives <span className="text-danger">*</span>
        </legend>
        <ul className="grid gap-2 sm:grid-cols-2">
          {INVESTMENT_OBJECTIVES.map((o) => {
            const id = `${idPrefix}-obj-${o.replace(/\W+/g, "-")}`;
            return (
              <li key={o} className="flex items-center gap-2.5">
                <input id={id} type="checkbox" name="objectives" value={o} className="h-4 w-4 accent-navy-900" />
                <label htmlFor={id} className="text-sm text-charcoal-700">{o}</label>
              </li>
            );
          })}
        </ul>
        <FieldError id={`${idPrefix}-objectives`} errors={state.errors?.objectives} />
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          idPrefix={idPrefix}
          name="preferredContact"
          label="Preferred contact method"
          required
          placeholder="Choose…"
          options={CONTACT_METHODS.map((c) => ({ value: c, label: c }))}
          state={state}
        />
        <TextField
          idPrefix={idPrefix}
          name="timeZone"
          label="Your time zone"
          defaultValue={timeZone}
          key={timeZone}
          hint="Detected automatically — so we can suggest meeting times that suit you."
          state={state}
        />
      </div>
      <CheckboxField idPrefix={idPrefix} name="remoteConsultation" label="I'd like a remote consultation (video or phone call)" state={state} />
      <TextAreaField idPrefix={idPrefix} name="message" label="Tell us about your goals" rows={4} state={state} />
      <CheckboxField
        idPrefix={idPrefix}
        name="consent"
        label="I agree that my details may be used to respond to this enquiry, as described in the privacy policy."
        required
        state={state}
      />
      <AttributionFields />
      <Honeypot />
      <SubmitButton className="btn-primary w-full sm:w-auto">Request an investor consultation</SubmitButton>
    </form>
  );
}
