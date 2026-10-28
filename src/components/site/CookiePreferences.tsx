"use client";

import { useEffect, useState } from "react";
import { readConsent, writeConsent } from "./analytics";

export function CookiePreferences() {
  const [value, setValue] = useState<"granted" | "denied" | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => setValue(readConsent()), []);

  return (
    <fieldset className="card mt-10 p-6">
      <legend className="sr-only">Analytics preference</legend>
      <div className="flex items-start gap-3">
        <input
          id="pref-analytics"
          type="checkbox"
          checked={value === "granted"}
          onChange={(e) => {
            const v = e.target.checked ? "granted" : "denied";
            setValue(v);
            writeConsent(v);
            setSaved(true);
          }}
          className="mt-1 h-5 w-5 accent-navy-900"
        />
        <label htmlFor="pref-analytics" className="text-charcoal-700">
          <span className="block font-semibold text-navy-900">Allow analytics</span>
          <span className="text-sm">Helps us understand which pages are useful. May set analytics cookies.</span>
        </label>
      </div>
      <p role="status" className="mt-4 text-sm text-success">{saved ? "Your preference has been saved." : ""}</p>
    </fieldset>
  );
}
