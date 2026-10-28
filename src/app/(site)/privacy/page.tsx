import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

export default async function PrivacyPage() {
  const s = await getSettings();
  const contact = s.email ?? "[EMAIL ADDRESS]";
  return (
    <LegalPage
      title="Privacy policy"
      updated="[DATE]"
      sections={[
        {
          heading: "Who we are",
          body: [
            `This website is operated by ${s.companyName}${s.officeAddress ? `, ${s.officeAddress.replace(/\n/g, ", ")}` : " [OFFICE ADDRESS]"}. We are responsible for the personal information you share with us through this website.`,
          ],
        },
        {
          heading: "Information we collect",
          body: [
            "When you submit an enquiry, request a viewing, book a consultation, submit a property or subscribe to updates, we collect the details you provide: typically your name, email address, phone number, your message and, where relevant, the property you are interested in and your preferred viewing date.",
            "We do not require you to create an account to browse properties or contact us. Properties you save are stored in a cookie on your own device, not on our servers.",
          ],
        },
        {
          heading: "How we use your information",
          body: [
            "We use your information to respond to your enquiry, arrange viewings, provide the services you request, and keep a record of our communication with you.",
            "If you subscribe to property updates, we use your email address to send them. You can unsubscribe at any time.",
            "We do not sell your personal information.",
          ],
        },
        {
          heading: "Who can access it",
          body: [
            "Enquiries are accessible only to authorised staff through a secure administration system. We use trusted service providers to host the website, store images, and send email; they process data only on our instructions. [LIST PROVIDERS, e.g. hosting, email, media storage]",
          ],
        },
        {
          heading: "How long we keep it",
          body: [
            "We keep enquiry records for as long as needed to deal with your request and for a reasonable period afterwards for legitimate business and legal purposes. [STATE RETENTION PERIOD, e.g. 24 months after last contact]",
          ],
        },
        {
          heading: "Your rights",
          body: [
            `Depending on where you live, you may have the right to access, correct or delete the personal information we hold about you, or to object to how we use it. To make a request, contact us at ${contact}.`,
          ],
        },
        {
          heading: "Contact",
          body: [`Questions about this policy can be sent to ${contact}.`],
        },
      ]}
    />
  );
}
