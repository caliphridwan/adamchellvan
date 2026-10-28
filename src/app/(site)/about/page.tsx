import Link from "next/link";
import { PAGE_IMAGES } from "@/lib/placeholder-images";
import type { Metadata } from "next";
import { Editable, PageHero } from "@/components/site/common";
import { getPublishedServices } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { paragraphs, titledLines } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: "About us",
    description: s.shortDescription || `About ${s.companyName}.`,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const [s, services] = await Promise.all([getSettings(), getPublishedServices()]);
  const story = paragraphs(s.aboutStory);
  const values = titledLines(s.values);
  const differentiators = titledLines(s.differentiators);

  return (
    <>
      <PageHero
        image={PAGE_IMAGES.about}
        eyebrow="About us"
        title={s.companyName}
        intro={s.slogan || undefined}
        breadcrumbs={[{ label: "About" }]}
      />

      <section className="container grid gap-12 py-16 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="eyebrow">Our story</p>
          <h2 className="mt-3 text-display-md">
            <Editable value={s.introHeading} placeholder="[ABOUT HEADING]" />
          </h2>
          <div className="rule mt-8" />
        </div>
        <div className="space-y-5 text-[1.06rem] leading-[1.85] text-charcoal-700 lg:col-span-7 lg:col-start-6">
          {story.length ? story.map((p, i) => <p key={i}>{p}</p>) : (
            <p><Editable value={null} placeholder="[COMPANY STORY FROM YOUR COPY — edit in Admin › Content › Site settings]" /></p>
          )}
        </div>
      </section>

      {s.mission || s.vision ? (
        <section className="bg-navy-950 py-16 text-ivory-50 md:py-24">
          <div className="container grid gap-12 md:grid-cols-2">
            {s.mission ? (
              <div>
                <p className="eyebrow-light">Our mission</p>
                <p className="mt-5 font-display text-3xl leading-snug text-ivory-50">{s.mission}</p>
              </div>
            ) : null}
            {s.vision ? (
              <div>
                <p className="eyebrow-light">Our vision</p>
                <p className="mt-5 font-display text-3xl leading-snug text-ivory-50">{s.vision}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {values.length ? (
        <section className="container py-16 md:py-24">
          <p className="eyebrow">Our values</p>
          <h2 className="mt-3 text-display-md">What guides our work</h2>
          <ul className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {values.map((v, i) => (
              <li key={i}>
                <div className="rule mb-6" />
                <h3 className="text-2xl">{v.title}</h3>
                {v.body ? <p className="mt-3 leading-relaxed text-charcoal-500">{v.body}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {differentiators.length ? (
        <section className="border-t border-ivory-200 bg-white py-16 md:py-24">
          <div className="container">
            <p className="eyebrow">Our approach</p>
            <h2 className="mt-3 text-display-md">Why clients choose us</h2>
            <ul className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {differentiators.map((d, i) => (
                <li key={i}>
                  <h3 className="text-2xl">{d.title}</h3>
                  {d.body ? <p className="mt-3 leading-relaxed text-charcoal-500">{d.body}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {services.length ? (
        <section className="container py-16 md:py-24" aria-labelledby="about-services">
          <p className="eyebrow">What we do</p>
          <h2 id="about-services" className="mt-3 text-display-md">Our services</h2>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-md border border-ivory-200 bg-ivory-200 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((sv) => (
              <li key={sv.slug} className="relative bg-white p-7 hover:bg-ivory-50">
                <h3 className="text-2xl">
                  <Link href={`/services/${sv.slug}`} className="after:absolute after:inset-0">{sv.title}</Link>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-500">{sv.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="container py-16 text-center md:py-20">
        <h2 className="text-display-md">Work with {s.companyName}</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/properties" className="btn-outline">Browse properties</Link>
          <Link href="/contact?type=CONSULTATION" className="btn-primary">Book a consultation</Link>
        </div>
        {s.registrationInfo ? <p className="mt-8 text-xs text-charcoal-500">{s.registrationInfo}</p> : null}
      </section>
    </>
  );
}
