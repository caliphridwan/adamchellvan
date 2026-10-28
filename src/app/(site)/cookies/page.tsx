import type { Metadata } from "next";
import { CookiePreferences } from "@/components/site/CookiePreferences";
import { PageHero } from "@/components/site/common";

export const metadata: Metadata = { title: "Cookie preferences", alternates: { canonical: "/cookies" } };

export default function CookiesPage() {
  const analyticsEnabled = Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || process.env.NEXT_PUBLIC_GA_ID);
  return (
    <>
      <PageHero eyebrow="Legal" title="Cookie preferences" breadcrumbs={[{ label: "Cookie preferences" }]} />
      <section className="container max-w-3xl py-14 md:py-20">
        <div className="prose-estate">
          <h2>What we store on your device</h2>
          <p>
            We keep this to a minimum. The website uses the following, all first-party and none used for advertising:
          </p>
          <ul>
            <li>Saved properties: a functional cookie (<code>pe_saved</code>) that remembers listings you save with the heart icon. It stays on your device.</li>
            <li>Your analytics choice: stored in your browser's local storage so we don't ask again.</li>
            <li>Staff sign-in: a secure session cookie used only in the private administration area.</li>
            <li>Visit source: when you arrive, we note in your browser session (not a cookie) which website or campaign referred you, so we can tell which channels are useful. It is attached to an enquiry only if you send one.</li>
          </ul>
          <h2>Analytics</h2>
          {analyticsEnabled ? (
            <p>
              With your permission, we use analytics ({[process.env.NEXT_PUBLIC_GA_ID ? "Google Analytics 4" : null, process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? "Plausible" : null].filter(Boolean).join(" and ")}) to
              understand which pages and listings are viewed and which contact options are used.
              {process.env.NEXT_PUBLIC_GA_ID ? " Google Analytics sets cookies (such as _ga); these are only placed after you accept." : ""} You can change your choice below at any time.
            </p>
          ) : (
            <p>No analytics service is currently enabled on this website.</p>
          )}
        </div>
        {analyticsEnabled ? <CookiePreferences /> : null}
      </section>
    </>
  );
}
