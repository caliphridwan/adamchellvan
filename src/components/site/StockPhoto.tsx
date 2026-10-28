import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import { cn } from "@/lib/utils";
import { localPath, remoteUrl, type StockImage } from "@/lib/placeholder-images";
import { FallbackImg } from "./FallbackImg";

/** Sources to try, in order: the copy bundled in /public (if downloaded), then Unsplash's CDN. */
function sources(img: StockImage, w: number): string[] {
  const local = localPath(img);
  const hasLocal = existsSync(path.join(process.cwd(), "public", local));
  return hasLocal ? [local, remoteUrl(img, { w })] : [remoteUrl(img, { w })];
}

/** Full-bleed background photograph with a navy overlay (for heroes and bands). */
export function StockBackdrop({
  image,
  priority = false,
  overlay = "strong",
  credit = true,
}: {
  image: StockImage;
  priority?: boolean;
  overlay?: "strong" | "medium" | "side";
  credit?: boolean;
}) {
  return (
    <>
      <FallbackImg srcs={sources(image, 2000)} alt={image.alt} priority={priority} className="-z-20" />
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 -z-10",
          overlay === "strong" && "bg-navy-950/75",
          overlay === "medium" && "bg-navy-950/60",
          overlay === "side" && "bg-gradient-to-r from-navy-950/90 via-navy-950/65 to-navy-950/25",
        )}
      />
      {credit ? <PhotoCredit image={image} className="absolute bottom-3 right-4 z-10" /> : null}
    </>
  );
}

/** Contained photograph (cards, section art). Parent must be `relative` with a set size. */
export function StockFill({ image, className }: { image: StockImage; sizes?: string; className?: string }) {
  return <FallbackImg srcs={sources(image, 1200)} alt={image.alt} className={className} />;
}

export function PhotoCredit({ image, className, tone = "light" }: { image: StockImage; className?: string; tone?: "light" | "dark" }) {
  return (
    <p className={cn("text-[0.62rem] tracking-wide", tone === "light" ? "text-ivory-100/60" : "text-charcoal-500", className)}>
      {image.location} · Photo:{" "}
      <a href={image.photoPage} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
        {image.photographer}
      </a>{" "}
      / Unsplash
    </p>
  );
}
