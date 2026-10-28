import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Content" };

export default async function ContentIndexPage() {
  const user = await requireUser("content.write");
  const [services, faqs, testimonials, articles, categories, locations, amenities, subscribers] = await Promise.all([
    db.service.count(),
    db.faq.count(),
    db.testimonial.count(),
    db.article.count(),
    db.propertyCategory.count(),
    db.location.count(),
    db.amenity.count(),
    db.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
  ]);
  const cards = [
    ...(can(user.role, "settings.write")
      ? [{ href: "/admin/content/settings", title: "Site settings", body: "Company details, contact information, homepage and about-page copy, social links, SEO defaults." }]
      : []),
    { href: "/admin/content/services", title: "Services", body: `${services} service page${services === 1 ? "" : "s"}` },
    { href: "/admin/content/articles", title: "Articles & insights", body: `${articles} article${articles === 1 ? "" : "s"}` },
    { href: "/admin/content/faqs", title: "FAQs", body: `${faqs} question${faqs === 1 ? "" : "s"}` },
    { href: "/admin/content/testimonials", title: "Testimonials", body: `${testimonials} — only client-authorised testimonials can be published` },
    { href: "/admin/content/taxonomy", title: "Categories, locations & amenities", body: `${categories} categories · ${locations} locations · ${amenities} amenities` },
  ];
  return (
    <>
      <PageHeader title="Content" description={`${subscribers} active newsletter subscriber${subscribers === 1 ? "" : "s"}`} />
      <ul className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="block h-full rounded-md border border-ivory-200 bg-white p-6 transition-shadow hover:shadow-card">
              <h2 className="font-display text-2xl text-navy-900">{c.title}</h2>
              <p className="mt-1 text-sm text-charcoal-500">{c.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
