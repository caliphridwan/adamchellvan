import type { Metadata } from "next";
import { PAGE_IMAGES } from "@/lib/placeholder-images";
import { IconClock, IconMail, IconPhone, IconPin, IconWhatsApp } from "@/components/icons";
import { EnquiryFormInner } from "@/components/site/EnquiryForm";
import { TrackedLink } from "@/components/site/analytics";
import { PageHero } from "@/components/site/common";
import { PLACEHOLDER } from "@/lib/constants";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { telLink, whatsappLink } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: "Contact us",
    description: `Contact ${s.companyName} about buying, selling, renting or investing in property.`,
    alternates: { canonical: "/contact" },
  };
}

type Props = { searchParams: { type?: string; property?: string } };

export default async function ContactPage({ searchParams }: Props) {
  const s = await getSettings();
  const type = ["GENERAL", "PROPERTY", "CONSULTATION"].includes(searchParams.type ?? "") ? searchParams.type : "GENERAL";
  const ref =
    typeof searchParams.property === "string" && /^[a-z0-9-]{1,80}$/.test(searchParams.property)
      ? await db.property.findFirst({ where: { slug: searchParams.property, isPublished: true }, select: { reference: true, title: true } })
      : null;
  const tel = telLink(s.phone);
  const wa = whatsappLink(s.whatsapp, `Hello ${s.companyName}, I'd like to make an enquiry.`);

  return (
    <>
      <PageHero
        image={PAGE_IMAGES.contact}
        eyebrow="Contact"
        title="Speak with our team"
        intro="Whether you're buying, selling, renting, leasing or investing — in Nigeria or from abroad — we'd be glad to hear from you. Remote consultations are available for international clients."
        breadcrumbs={[{ label: "Contact" }]}
      />
      <section className="container grid gap-14 py-16 md:py-20 lg:grid-cols-[1fr_420px]">
        <div className="card p-6 md:p-10">
          <h2 className="text-3xl">Send us a message</h2>
          <p className="mt-2 text-sm text-charcoal-500">Fields marked * are required. We'll only use your details to respond.</p>
          <div className="mt-8">
            <EnquiryFormInner
              showTypeSelect
              defaultType={type}
              showPropertyReference
              showRemoteOption
              defaultReference={ref?.reference}
              defaultMessage={ref ? `I'm interested in “${ref.title}”.` : undefined}
              source="/contact"
            />
          </div>
        </div>

        <aside className="space-y-8" aria-label="Contact details">
          <ul className="space-y-6">
            <li className="flex gap-4">
              <IconPhone className="mt-1 h-5 w-5 shrink-0 text-champagne-700" />
              <div>
                <p className="field-label">Telephone</p>
                {tel ? (
                  <TrackedLink event="Phone Click" track="phone" href={tel} className="text-lg text-navy-900 hover:text-champagne-700">{s.phone}</TrackedLink>
                ) : (
                  <p className="text-lg text-charcoal-500">{PLACEHOLDER.phone}</p>
                )}
              </div>
            </li>
            <li className="flex gap-4">
              <IconWhatsApp className="mt-1 h-5 w-5 shrink-0 text-champagne-700" />
              <div>
                <p className="field-label">WhatsApp</p>
                {wa ? (
                  <TrackedLink event="WhatsApp Click" track="whatsapp" href={wa} target="_blank" rel="noopener noreferrer" className="text-lg text-navy-900 hover:text-champagne-700">
                    Start a chat
                  </TrackedLink>
                ) : (
                  <p className="text-lg text-charcoal-500">[WHATSAPP NUMBER]</p>
                )}
              </div>
            </li>
            <li className="flex gap-4">
              <IconMail className="mt-1 h-5 w-5 shrink-0 text-champagne-700" />
              <div>
                <p className="field-label">Email</p>
                {s.email ? (
                  <TrackedLink event="Email Click" track="email" href={`mailto:${s.email}`} className="break-all text-lg text-navy-900 hover:text-champagne-700">{s.email}</TrackedLink>
                ) : (
                  <p className="text-lg text-charcoal-500">{PLACEHOLDER.email}</p>
                )}
              </div>
            </li>
            <li className="flex gap-4">
              <IconPin className="mt-1 h-5 w-5 shrink-0 text-champagne-700" />
              <div>
                <p className="field-label">Office</p>
                <p className="whitespace-pre-line text-lg text-navy-900">{s.officeAddress || PLACEHOLDER.address}</p>
              </div>
            </li>
            <li className="flex gap-4">
              <IconClock className="mt-1 h-5 w-5 shrink-0 text-champagne-700" />
              <div>
                <p className="field-label">Business hours</p>
                <p className="whitespace-pre-line text-navy-900">{s.businessHours || PLACEHOLDER.hours}</p>
              </div>
            </li>
          </ul>
          {s.mapQuery ? (
            <div className="aspect-[4/3] overflow-hidden rounded-md border border-ivory-200 bg-ivory-200">
              <iframe
                title={`Map showing the ${s.companyName} office`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(s.mapQuery)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
              />
            </div>
          ) : null}
        </aside>
      </section>
    </>
  );
}
