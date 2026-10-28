"use client";

import { useId } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import type { FormState } from "@/lib/validation";
import { DIAL_CODES } from "@/lib/constants";

export function SubmitButton({
  children,
  pendingLabel = "Sending…",
  className = "btn-primary",
  name,
  value,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-disabled={pending} name={name} value={value}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={`${id}-error`} className="field-error">
      {errors[0]}
    </p>
  );
}

type BaseProps = {
  name: string;
  label: string;
  state?: FormState;
  hint?: string;
  required?: boolean;
  className?: string;
  /** Prefix for element ids — set when several forms with the same field names share a page. */
  idPrefix?: string;
};

function describedBy(id: string, hint?: string, hasError?: boolean) {
  return [hasError ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
}

export function TextField({
  name,
  label,
  idPrefix,
  state,
  hint,
  required,
  className,
  type = "text",
  defaultValue,
  ...rest
}: BaseProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
  const id = `${idPrefix ?? "f"}-${name}`;
  const errors = state?.errors?.[name];
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, hint, Boolean(errors?.length))}
        className="field"
        {...rest}
      />
      {hint ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
      <FieldError id={id} errors={errors} />
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  idPrefix,
  state,
  hint,
  required,
  className,
  rows = 5,
  defaultValue,
  ...rest
}: BaseProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  const id = `${idPrefix ?? "f"}-${name}`;
  const errors = state?.errors?.[name];
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, hint, Boolean(errors?.length))}
        className="field leading-relaxed"
        {...rest}
      />
      {hint ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
      <FieldError id={id} errors={errors} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  idPrefix,
  state,
  hint,
  required,
  className,
  options,
  defaultValue,
  placeholder,
  ...rest
}: BaseProps & {
  options: { value: string; label: string }[];
  placeholder?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  const id = `${idPrefix ?? "f"}-${name}`;
  const errors = state?.errors?.[name];
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, hint, Boolean(errors?.length))}
        className="field"
        {...rest}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
      <FieldError id={id} errors={errors} />
    </div>
  );
}

export function CheckboxField({
  name,
  label,
  idPrefix,
  state,
  defaultChecked,
  className,
  hint,
  required,
}: BaseProps & { defaultChecked?: boolean }) {
  const id = `${idPrefix ?? "f"}-${name}`;
  const errors = state?.errors?.[name];
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          required={required}
          aria-invalid={errors?.length ? true : undefined}
          aria-describedby={describedBy(id, hint, Boolean(errors?.length))}
          className="mt-0.5 h-5 w-5 shrink-0 rounded-sm border-ivory-300 accent-navy-900"
        />
        <label htmlFor={id} className="text-sm leading-snug text-charcoal-700">
          {label}
        </label>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="field-hint pl-8">
          {hint}
        </p>
      ) : null}
      <FieldError id={id} errors={errors} />
    </div>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <div
      role={state.ok ? "status" : "alert"}
      className={cn(
        "rounded border px-4 py-3 text-sm",
        state.ok ? "border-success/30 bg-success/5 text-success" : "border-danger/30 bg-danger/5 text-danger",
      )}
    >
      {state.message}
    </div>
  );
}

/** Hidden honeypot field for spam bots. */
export function Honeypot() {
  const id = useId();
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
      <label htmlFor={id}>Leave this field empty</label>
      <input id={id} name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

/** Phone number with a country dialling-code picker (Nigeria by default). Submits `phoneCountry` + `phone`. */
export function PhoneField({
  label = "Phone / WhatsApp",
  state,
  required,
  idPrefix = "f",
  hint,
  defaultCountry = "+234",
  className,
}: {
  label?: string;
  state?: FormState;
  required?: boolean;
  idPrefix?: string;
  hint?: string;
  defaultCountry?: string;
  className?: string;
}) {
  const id = `${idPrefix}-phone`;
  const errors = state?.errors?.phone;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      <div className="flex gap-2">
        <label htmlFor={`${id}-country`} className="sr-only">Country code</label>
        <select id={`${id}-country`} name="phoneCountry" defaultValue={defaultCountry} className="field w-[7.5rem] shrink-0 px-2 text-sm">
          {DIAL_CODES.map((d) => (
            <option key={d.code + d.label} value={d.code}>{d.label}</option>
          ))}
        </select>
        <input
          id={id}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required={required}
          placeholder="e.g. 0803 000 0000"
          aria-invalid={errors?.length ? true : undefined}
          aria-describedby={[errors?.length ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined}
          className="field min-w-0 flex-1"
        />
      </div>
      {hint ? <p id={`${id}-hint`} className="field-hint">{hint}</p> : null}
      <FieldError id={id} errors={errors} />
    </div>
  );
}
