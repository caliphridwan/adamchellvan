import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Terms of use", alternates: { canonical: "/terms" } };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <LegalPage
      title="Terms of use"
      updated="[DATE]"
      sections={[
        {
          heading: "About these terms",
          body: [`These terms govern your use of the ${s.companyName} website. By using the website you agree to them.`],
        },
        {
          heading: "Property information",
          body: [
            "Listings are provided for general information and do not form part of any offer or contract. While we take care to keep details accurate, prices, availability, measurements and descriptions may change and should be verified before you make any decision.",
            "Images may be illustrative. Floor areas and plot sizes are approximate unless stated otherwise.",
            "You should carry out your own due diligence, including independent legal, survey and title verification, before entering into any transaction.",
          ],
        },
        {
          heading: "Acceptable use",
          body: [
            "You must not misuse the website, attempt to gain unauthorised access to it, submit false information, or copy listing content for commercial use without our permission.",
          ],
        },
        {
          heading: "Intellectual property",
          body: [`Website content, including text, photography and branding, belongs to ${s.companyName} or its licensors.`],
        },
        {
          heading: "Liability",
          body: ["[INSERT LIMITATION OF LIABILITY WORDING APPROVED BY YOUR LEGAL ADVISER]"],
        },
        {
          heading: "Governing law",
          body: ["[INSERT GOVERNING LAW AND JURISDICTION]"],
        },
      ]}
    />
  );
}
