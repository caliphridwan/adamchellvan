import type { Metadata } from "next";
import { saveSettings } from "@/app/admin/actions/content";
import { EntityForm, type FormValues } from "@/components/admin/EntityForm";
import { PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Site settings" };

export default async function SettingsPage() {
  await requireUser("settings.write");
  const s = await getSettings();
  const { updatedAt: _updatedAt, id: _id, ...rest } = s;
  const values: FormValues = Object.fromEntries(
    Object.entries(rest).map(([k, v]) => [k, v === null || v === undefined ? "" : String(v)]),
  );

  return (
    <>
      <PageHeader
        title="Site settings"
        description="Use the client's exact company name, contact details and approved copy. Leave a field blank rather than guessing."
        back={{ href: "/admin/content", label: "Content" }}
      />
      <EntityForm
        action={saveSettings}
        values={values}
        submitLabel="Save settings"
        sections={[
          {
            title: "Company",
            fields: [
              { type: "text", name: "companyName", label: "Company name", required: true, span: 1 },
              { type: "text", name: "slogan", label: "Slogan", span: 1 },
              { type: "text", name: "brandPrimary", label: "Logo — main line", span: 1, hint: "e.g. ADAM CHELLVAN (shown when no logo image is set)." },
              { type: "text", name: "brandSecondary", label: "Logo — second line", span: 1, hint: "e.g. PROPERTIES AND INVESTMENT" },
              { type: "textarea", name: "shortDescription", label: "Short description", rows: 3, hint: "Used in the footer and as the default meta description." },
              { type: "url", name: "logoUrl", label: "Logo URL", span: 1, hint: "https:// link to an SVG or PNG." },
              { type: "text", name: "registrationInfo", label: "Registration details", span: 1, hint: "Only when verified, e.g. RC number." },
              { type: "text", name: "currency", label: "Default currency", span: 1, hint: "3-letter code, e.g. NGN, USD, GBP." },
            ],
          },
          {
            title: "Currency conversion & disclaimers",
            description: "Indicative conversions are shown under listing prices for international visitors. They are labelled as estimates, never quotes.",
            fields: [
              { type: "textarea", name: "fxRates", label: "Indicative exchange rates", rows: 4, span: 1, hint: "One per line: how many units of the default currency equal 1 unit, e.g. USD=1550, GBP=2050. Leave blank to hide conversions." },
              { type: "text", name: "fxRatesDate", label: "Rates last updated", span: 1, hint: "Shown beside every estimate, e.g. 28 Oct 2026. Update rates regularly." },
              { type: "textarea", name: "listingDisclaimer", label: "Listing disclaimer", rows: 3, hint: "Shown on every property page and in confirmation emails." },
            ],
          },
          {
            title: "Contact",
            fields: [
              { type: "tel", name: "phone", label: "Phone", span: 1 },
              { type: "tel", name: "whatsapp", label: "WhatsApp number", span: 1, hint: "International format, digits only, e.g. 2348012345678." },
              { type: "email", name: "email", label: "Email", span: 1, hint: "Also receives enquiry notifications unless NOTIFY_EMAIL is set." },
              { type: "text", name: "mapQuery", label: "Office map location", span: 1, hint: "Address or place name for the contact-page map. Leave blank to hide the map." },
              { type: "textarea", name: "officeAddress", label: "Office address", rows: 3, span: 1 },
              { type: "textarea", name: "businessHours", label: "Business hours", rows: 3, span: 1 },
            ],
          },
          {
            title: "Homepage",
            fields: [
              { type: "url", name: "heroImageUrl", label: "Hero image URL", span: 1, hint: "A licensed, high-resolution photograph (https://). Until set, a placeholder photo of Victoria Island, Lagos is shown." },
              { type: "text", name: "heroImageAlt", label: "Hero image description", span: 1 },
              { type: "text", name: "heroEyebrow", label: "Hero eyebrow", hint: "Short line above the headline." },
              { type: "text", name: "heroHeadline", label: "Hero headline" },
              { type: "textarea", name: "heroSubtext", label: "Hero supporting text", rows: 2 },
              { type: "text", name: "heroSearchHeading", label: "Search heading", span: 1, placeholder: "Find your next property" },
              { type: "text", name: "heroSearchText", label: "Search sub-text", span: 1 },
              { type: "text", name: "servicesStrip", label: "Services strip", hint: "Separate items with ·  e.g. Buy · Sell · Rent · Lease · Invest · Source" },
              { type: "text", name: "introHeading", label: "Introduction heading" },
              { type: "textarea", name: "introBody", label: "Introduction text", rows: 5 },
              { type: "textarea", name: "categoryCards", label: "Property category cards", rows: 4, hint: "Exactly 4 lines as “Title: description”, linking in order to Residential, Commercial, Land and Investment." },
              { type: "text", name: "approachHeading", label: "Approach heading" },
              { type: "textarea", name: "approachBody", label: "Approach text", rows: 3 },
              { type: "textarea", name: "differentiators", label: "Approach points", rows: 5, hint: "One per line, optionally “Title: description”. Genuine points only." },
              { type: "text", name: "internationalHeading", label: "International section heading", hint: "Leave blank to hide the section on the homepage." },
              { type: "textarea", name: "internationalBody", label: "International section text", rows: 3 },
              { type: "text", name: "internationalCtaText", label: "International call-to-action text" },
              { type: "text", name: "insightsHeading", label: "Insights heading" },
              { type: "textarea", name: "insightsBody", label: "Insights introduction", rows: 3 },
              { type: "text", name: "ctaHeading", label: "Consultation call-to-action heading" },
              { type: "textarea", name: "ctaBody", label: "Consultation call-to-action text", rows: 2 },
            ],
          },
          {
            title: "About page",
            fields: [
              { type: "textarea", name: "aboutStory", label: "Company story", rows: 8, hint: "Separate paragraphs with a blank line." },
              { type: "textarea", name: "mission", label: "Mission", rows: 3, span: 1 },
              { type: "textarea", name: "vision", label: "Vision", rows: 3, span: 1 },
              { type: "textarea", name: "values", label: "Values", rows: 5, hint: "One per line as “Title: description”." },
            ],
          },
          {
            title: "Social media",
            fields: [
              { type: "url", name: "facebookUrl", label: "Facebook", span: 1 },
              { type: "url", name: "instagramUrl", label: "Instagram", span: 1 },
              { type: "url", name: "linkedinUrl", label: "LinkedIn", span: 1 },
              { type: "url", name: "xUrl", label: "X (Twitter)", span: 1 },
              { type: "url", name: "youtubeUrl", label: "YouTube", span: 1 },
              { type: "url", name: "tiktokUrl", label: "TikTok", span: 1 },
            ],
          },
          {
            title: "Footer & SEO",
            fields: [
              { type: "textarea", name: "footerNote", label: "Footer note", rows: 2, hint: "e.g. a short legal disclaimer." },
              { type: "text", name: "seoTitle", label: "Default SEO title", hint: "Max 70 characters." },
              { type: "textarea", name: "seoDescription", label: "Default SEO description", rows: 2, hint: "Max 320 characters." },
            ],
          },
        ]}
      />
    </>
  );
}
