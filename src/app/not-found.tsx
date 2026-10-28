import Link from "next/link";
import { StockBackdrop } from "@/components/site/StockPhoto";
import { STOCK_IMAGES } from "@/lib/placeholder-images";

export default function NotFound() {
  return (
    <main id="main" className="relative isolate flex min-h-screen items-center overflow-hidden bg-navy-950 text-ivory-50">
      <StockBackdrop image={STOCK_IMAGES.lagosWhiteTower} overlay="strong" />
      <div className="container py-24">
        <p className="eyebrow-light">Error 404</p>
        <h1 className="mt-4 max-w-2xl text-display-xl text-ivory-50">This page could not be found</h1>
        <p className="mt-6 max-w-xl text-lg text-ivory-100/75">
          The listing may have been sold, let or withdrawn, or the link may be out of date.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/properties" className="btn-gold">Browse properties</Link>
          <Link href="/" className="btn-outline-light">Back to home</Link>
          <Link href="/contact" className="btn-outline-light">Contact us</Link>
        </div>
      </div>
    </main>
  );
}
