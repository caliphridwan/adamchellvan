import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { AnalyticsAndConsent } from "@/components/site/analytics";
import { getPublishedServices } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

// Pages read live data (listings, settings) from PostgreSQL on each request,
// so the build never needs a database connection.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = s.seoTitle || s.companyName;
  const description = s.seoDescription || s.shortDescription || undefined;
  return {
    title: { default: title, template: `%s | ${s.companyName}` },
    description,
    openGraph: {
      type: "website",
      siteName: s.companyName,
      title,
      description,
      ...(s.heroImageUrl ? { images: [{ url: s.heroImageUrl }] } : {}),
    },
    twitter: { card: "summary_large_image" },
    // Canonical URLs are set per page (a layout-level canonical would leak to every child page).
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, services] = await Promise.all([getSettings(), getPublishedServices()]);
  return (
    <>
      <Header settings={settings} />
      <main id="main">{children}</main>
      <Footer settings={settings} services={services} />
      <AnalyticsAndConsent />
    </>
  );
}
