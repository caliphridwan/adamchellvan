import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { LoginForm } from "./LoginForm";
import { StockBackdrop } from "@/components/site/StockPhoto";
import { STOCK_IMAGES } from "@/lib/placeholder-images";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  if (await getCurrentUser()) redirect("/admin");
  const settings = await getSettings();
  const next = typeof searchParams.next === "string" && /^\/admin(\/[^\s]*)?$/.test(searchParams.next) ? searchParams.next : "";
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-4 py-12">
      <StockBackdrop image={STOCK_IMAGES.victoriaIslandSkyline} overlay="strong" credit={false} />
      <div className="w-full max-w-md rounded-md bg-white p-8 shadow-lift md:p-10">
        <p className="eyebrow">{settings.companyName}</p>
        <h1 className="mt-2 text-4xl">Staff sign in</h1>
        <p className="mt-2 text-sm text-charcoal-500">Authorised personnel only.</p>
        <div className="mt-8">
          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}
