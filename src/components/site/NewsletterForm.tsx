"use client";

import { useFormState } from "react-dom";
import { subscribeNewsletter } from "@/app/actions/public";
import { initialFormState } from "@/lib/validation";
import { FieldError, Honeypot, SubmitButton } from "@/components/ui/form";

export function NewsletterForm() {
  const [state, action] = useFormState(subscribeNewsletter, initialFormState);
  if (state.ok) {
    return (
      <p role="status" className="text-sm text-champagne-300">
        {state.message}
      </p>
    );
  }
  return (
    <form action={action} className="relative" noValidate>
      <h2 className="eyebrow-light mb-3 font-sans">Property updates</h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="nl-email" className="sr-only">
          Email address
        </label>
        <input
          id="nl-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Your email address"
          required
          aria-invalid={state.errors?.email ? true : undefined}
          aria-describedby={state.errors?.email ? "nl-email-error" : undefined}
          className="min-h-[44px] flex-1 rounded border border-white/15 bg-white/5 px-3.5 text-sm text-ivory-50 placeholder:text-ivory-100/50 focus:border-champagne-400 focus:outline-none"
        />
        <SubmitButton className="btn-gold btn-sm min-h-[44px]" pendingLabel="Subscribing…">
          Subscribe
        </SubmitButton>
      </div>
      <FieldError id="nl-email" errors={state.errors?.email} />
      <div className="mt-3 flex items-start gap-2.5">
        <input id="nl-consent" name="consent" type="checkbox" required className="mt-0.5 h-4 w-4 accent-champagne-400" />
        <label htmlFor="nl-consent" className="text-xs leading-snug text-ivory-100/70">
          I agree to receive property updates and insights by email. I can unsubscribe at any time.
        </label>
      </div>
      <FieldError id="nl-consent" errors={state.errors?.consent} />
      {state.message && !state.ok ? (
        <p role="alert" className="mt-2 text-xs text-red-300">
          {state.errors ? null : state.message}
        </p>
      ) : null}
      <Honeypot />
    </form>
  );
}
