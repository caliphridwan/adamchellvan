"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// ─── Analytics & consent ───
// • Google Analytics 4 (NEXT_PUBLIC_GA_ID) and/or Plausible (NEXT_PUBLIC_PLAUSIBLE_DOMAIN) load ONLY after the
//   visitor opts in. GA4 sets cookies, so it must never load before consent.
// • Contact-button clicks are also counted anonymously in our own database (no cookies, no personal data)
//   so the monthly report works even when a visitor declines analytics.

export const CONSENT_KEY = "pe_analytics_consent";
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
export const ANALYTICS_CONFIGURED = Boolean(PLAUSIBLE_DOMAIN || GA_ID);

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string | number> }) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_EVENT_NAMES: Record<string, string> = {
  "Enquiry Submitted": "generate_lead",
  "Viewing Requested": "generate_lead",
  "Requirement Submitted": "generate_lead",
  "Investor Enquiry": "generate_lead",
  "Listing Submitted": "generate_lead",
  "WhatsApp Click": "whatsapp_click",
  "Phone Click": "phone_click",
  "Email Click": "email_click",
  "Property Saved": "add_to_wishlist",
  "Property Shared": "share",
};

export function track(event: string, props?: Record<string, string | number>) {
  try {
    window.plausible?.(event, props ? { props } : undefined);
    window.gtag?.("event", GA_EVENT_NAMES[event] ?? event.toLowerCase().replace(/\s+/g, "_"), { ...props, event_label: event });
  } catch {
    /* analytics must never break the page */
  }
}

/** Anonymous first-party counter for contact clicks (see /api/events). */
export function countContactClick(kind: "whatsapp" | "phone" | "email", propertyId?: string) {
  try {
    const body = JSON.stringify({ kind, path: window.location.pathname, propertyId });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else void fetch("/api/events", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  } catch {
    /* ignore */
  }
}

export function readConsent(): "granted" | "denied" | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(v: "granted" | "denied") {
  try {
    window.localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event("pe-consent-change"));
}

// ─── First-touch attribution (sessionStorage only) ───

const ATTR_KEY = "pe_attribution";
export type Attribution = { utmSource?: string; utmMedium?: string; utmCampaign?: string; landingPage?: string };

function clean(v: string | null | undefined, max = 120): string | undefined {
  if (!v) return undefined;
  const s = v.replace(/[^\w .:/?=&%+@-]/g, "").slice(0, max);
  return s || undefined;
}

function captureAttribution() {
  try {
    if (window.sessionStorage.getItem(ATTR_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    let source = clean(params.get("utm_source"));
    let medium = clean(params.get("utm_medium"));
    if (!source && document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (host && host !== window.location.hostname) {
        source = clean(host);
        medium = /facebook|instagram|tiktok|twitter|x\.com|t\.co|linkedin|whatsapp|wa\.me|youtube|pinterest|snapchat/.test(host)
          ? "social"
          : /google|bing|yahoo|duckduckgo/.test(host)
            ? "organic"
            : "referral";
      }
    }
    const data: Attribution = {
      utmSource: source,
      utmMedium: medium,
      utmCampaign: clean(params.get("utm_campaign")),
      landingPage: clean(window.location.pathname),
    };
    window.sessionStorage.setItem(ATTR_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function readAttribution(): Attribution {
  try {
    return JSON.parse(window.sessionStorage.getItem(ATTR_KEY) ?? "{}") as Attribution;
  } catch {
    return {};
  }
}

/** Hidden inputs carrying the visitor's first-touch source into any lead form. */
export function AttributionFields() {
  const [a, setA] = useState<Attribution>({});
  useEffect(() => setA(readAttribution()), []);
  return (
    <>
      <input type="hidden" name="utmSource" value={a.utmSource ?? ""} />
      <input type="hidden" name="utmMedium" value={a.utmMedium ?? ""} />
      <input type="hidden" name="utmCampaign" value={a.utmCampaign ?? ""} />
      <input type="hidden" name="landingPage" value={a.landingPage ?? ""} />
    </>
  );
}

export function AnalyticsAndConsent() {
  const [consent, setConsent] = useState<"granted" | "denied" | null | "loading">("loading");
  const pathname = usePathname();

  useEffect(() => {
    captureAttribution();
    const update = () => setConsent(readConsent());
    update();
    window.addEventListener("pe-consent-change", update);
    return () => window.removeEventListener("pe-consent-change", update);
  }, []);

  // GA4 page views on client-side navigation.
  useEffect(() => {
    if (consent === "granted" && GA_ID) window.gtag?.("event", "page_view", { page_path: pathname });
  }, [pathname, consent]);

  if (!ANALYTICS_CONFIGURED) return null;

  return (
    <>
      {consent === "granted" && PLAUSIBLE_DOMAIN ? (
        <Script defer data-domain={PLAUSIBLE_DOMAIN} src="https://plausible.io/js/script.js" strategy="afterInteractive" />
      ) : null}
      {consent === "granted" && GA_ID ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(GA_ID)},{anonymize_ip:true,send_page_view:true});`}
          </Script>
        </>
      ) : null}
      {consent === null ? (
        <div
          role="region"
          aria-label="Analytics preferences"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-md border border-ivory-200 bg-white p-5 shadow-lift sm:inset-x-6 sm:bottom-6"
        >
          <p className="text-sm leading-relaxed text-charcoal-700">
            We'd like to use analytics cookies to understand how visitors use our website so we can improve it. You can
            change this at any time. <a href="/cookies" className="underline underline-offset-2">Learn more</a>.
          </p>
          <div className="mt-4 flex gap-3">
            <button type="button" className="btn-primary btn-sm" onClick={() => writeConsent("granted")}>
              Accept analytics
            </button>
            <button type="button" className="btn-outline btn-sm" onClick={() => writeConsent("denied")}>
              Decline
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Contact link that records the click (analytics if consented, plus an anonymous first-party count). */
export function TrackedLink({
  event,
  track: kind,
  propertyId,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { event: string; track?: "whatsapp" | "phone" | "email"; propertyId?: string }) {
  return (
    <a
      {...props}
      onClick={() => {
        track(event, propertyId ? { propertyId } : undefined);
        if (kind) countContactClick(kind, propertyId);
      }}
    >
      {children}
    </a>
  );
}
