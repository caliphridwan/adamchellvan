"use client";

import { useFormState } from "react-dom";
import { CheckboxField, FormMessage, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { initialFormState, type FormState } from "@/lib/validation";

// A serialisable, config-driven form so server pages can describe admin forms
// without shipping a bespoke client component for each entity.

export type FieldDef =
  | { type: "text" | "email" | "tel" | "url" | "number" | "date" | "password"; name: string; label: string; hint?: string; required?: boolean; placeholder?: string; span?: 1 | 2; step?: string; autoComplete?: string }
  | { type: "textarea"; name: string; label: string; hint?: string; required?: boolean; rows?: number; span?: 1 | 2; placeholder?: string }
  | { type: "select"; name: string; label: string; hint?: string; required?: boolean; options: { value: string; label: string }[]; placeholder?: string; span?: 1 | 2 }
  | { type: "checkbox"; name: string; label: string; hint?: string; span?: 1 | 2 }
  | { type: "checkboxes"; name: string; label: string; hint?: string; options: { value: string; label: string }[]; span?: 1 | 2 }
  | { type: "hidden"; name: string };

export type SectionDef = { title?: string; description?: string; fields: FieldDef[] };

export type FormValues = Record<string, string | number | boolean | string[] | null | undefined>;

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  sections: SectionDef[];
  values?: FormValues;
  submitLabel?: string;
  resetOnSuccess?: boolean;
  /** Unique per form when several EntityForms with the same field names share a page. */
  idPrefix?: string;
};

function str(v: FormValues[string]): string | undefined {
  if (v === null || v === undefined || typeof v === "boolean" || Array.isArray(v)) return undefined;
  return String(v);
}

export function EntityForm({ action, sections, values = {}, submitLabel = "Save", resetOnSuccess = false, idPrefix = "f" }: Props) {
  const [state, formAction] = useFormState(action, initialFormState);
  // Remount the form fields after a successful "create" so inputs are cleared.
  const formKey = resetOnSuccess && state.ok ? `ok-${state.nonce ?? 0}` : "form";

  return (
    <form action={formAction} className="space-y-8" noValidate key={formKey}>
      <FormMessage state={state} />
      {sections.map((section, si) => (
        <fieldset key={si} className={cn("rounded-md border border-ivory-200 bg-white p-6 md:p-8", !section.title && "pt-6")}>
          {section.title ? <legend className="sr-only">{section.title}</legend> : null}
          {section.title ? (
            <div className="mb-6">
              <h2 className="font-display text-2xl text-navy-900">{section.title}</h2>
              {section.description ? <p className="mt-1 text-sm text-charcoal-500">{section.description}</p> : null}
            </div>
          ) : null}
          <div className="grid gap-5 md:grid-cols-2">
            {section.fields.map((f) => {
              if (f.type === "hidden") {
                return <input key={f.name} type="hidden" name={f.name} value={str(values[f.name]) ?? ""} />;
              }
              const spanClass = f.span === 1 ? "" : "md:col-span-2";
              switch (f.type) {
                case "textarea":
                  return (
                    <TextAreaField key={f.name} idPrefix={idPrefix} name={f.name} label={f.label} hint={f.hint} required={f.required} rows={f.rows ?? 5} placeholder={f.placeholder} defaultValue={str(values[f.name])} state={state} className={spanClass} />
                  );
                case "select":
                  return (
                    <SelectField key={f.name} idPrefix={idPrefix} name={f.name} label={f.label} hint={f.hint} required={f.required} options={f.options} placeholder={f.placeholder} defaultValue={str(values[f.name]) ?? ""} state={state} className={f.span === 2 ? "md:col-span-2" : ""} />
                  );
                case "checkbox":
                  return (
                    <CheckboxField key={f.name} idPrefix={idPrefix} name={f.name} label={f.label} hint={f.hint} defaultChecked={values[f.name] === true} state={state} className={f.span === 2 ? "md:col-span-2" : ""} />
                  );
                case "checkboxes": {
                  const selected = Array.isArray(values[f.name]) ? (values[f.name] as string[]) : [];
                  return (
                    <fieldset key={f.name} className="md:col-span-2">
                      <legend className="field-label">{f.label}</legend>
                      {f.hint ? <p className="field-hint mb-3">{f.hint}</p> : null}
                      {f.options.length ? (
                        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {f.options.map((o) => {
                            const id = `${idPrefix}-${f.name}-${o.value}`;
                            return (
                              <li key={o.value} className="flex items-center gap-2.5">
                                <input id={id} type="checkbox" name={f.name} value={o.value} defaultChecked={selected.includes(o.value)} className="h-4 w-4 accent-navy-900" />
                                <label htmlFor={id} className="text-sm text-charcoal-700">{o.label}</label>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-sm text-charcoal-500">None defined yet.</p>
                      )}
                    </fieldset>
                  );
                }
                default:
                  return (
                    <TextField
                      key={f.name}
                      idPrefix={idPrefix}
                      name={f.name}
                      type={f.type}
                      label={f.label}
                      hint={f.hint}
                      required={f.required}
                      placeholder={f.placeholder}
                      step={f.step}
                      autoComplete={f.autoComplete}
                      defaultValue={str(values[f.name])}
                      state={state}
                      className={f.span === 2 ? "md:col-span-2" : ""}
                    />
                  );
              }
            })}
          </div>
        </fieldset>
      ))}
      <div className="flex justify-end">
        <SubmitButton className="btn-primary min-w-[160px]" pendingLabel="Saving…">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
