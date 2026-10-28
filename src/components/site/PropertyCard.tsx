import Image from "next/image";
import Link from "next/link";
import { IconArea, IconBath, IconBed, IconPin } from "@/components/icons";
import { STATUS_LABELS, TRANSACTION_LABELS } from "@/lib/constants";
import type { PropertyCardData } from "@/lib/queries";
import { cn, formatArea, formatPrice } from "@/lib/utils";
import { FavouriteButton } from "./FavouriteButton";
import { ImagePlaceholder } from "./ImagePlaceholder";

export function StatusBadge({ status, className }: { status: keyof typeof STATUS_LABELS; className?: string }) {
  const tone =
    status === "AVAILABLE"
      ? "bg-white/95 text-navy-900"
      : status === "SOLD" || status === "RENTED"
        ? "bg-navy-900 text-ivory-50"
        : "bg-champagne-300 text-navy-950";
  return <span className={cn("badge", tone, className)}>{STATUS_LABELS[status]}</span>;
}

export function PropertyCard({ property, priority = false }: { property: PropertyCardData; priority?: boolean }) {
  const image = property.media[0];
  const href = `/properties/${property.slug}`;
  const isLand = property.category.group === "LAND";
  const area = isLand
    ? formatArea(property.plotSize, property.plotSizeUnit)
    : formatArea(property.floorArea, property.floorAreaUnit) ?? formatArea(property.plotSize, property.plotSizeUnit);
  const price = formatPrice(property);
  const photoCount = property._count.media;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-md border border-ivory-200 bg-white shadow-card transition-shadow duration-300 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-ivory-200">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || property.title}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <ImagePlaceholder label="Photography coming soon" />
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <div className="flex flex-wrap gap-2">
            <span className="badge bg-navy-950/85 text-ivory-50">{TRANSACTION_LABELS[property.transactionType]}</span>
            {property.status !== "AVAILABLE" ? <StatusBadge status={property.status} /> : null}
            {property.isInvestment ? <span className="badge bg-champagne-300 text-navy-950">Investment</span> : null}
          </div>
        </div>
        {photoCount > 1 ? (
          <span className="absolute bottom-3 left-4 rounded-sm bg-navy-950/75 px-2 py-0.5 text-[0.7rem] font-medium text-ivory-50">
            {photoCount} photos
          </span>
        ) : null}
      </div>
      <div className="absolute right-3 top-3 z-10">
        <FavouriteButton propertyId={property.id} title={property.title} />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="eyebrow">{property.category.name}</p>
        <h3 className="mt-2 font-display text-[1.55rem] leading-tight">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {property.title}
          </Link>
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-charcoal-500">
          <IconPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{property.displayAddress || property.location.name}</span>
        </p>

        {property.bedrooms != null || property.bathrooms != null || area ? (
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-ivory-200 pt-4 text-sm text-charcoal-700">
            {property.bedrooms != null && !isLand ? (
              <li className="flex items-center gap-1.5">
                <IconBed className="h-4 w-4 text-champagne-700" />
                {property.bedrooms} {property.bedrooms === 1 ? "bed" : "beds"}
              </li>
            ) : null}
            {property.bathrooms != null && !isLand ? (
              <li className="flex items-center gap-1.5">
                <IconBath className="h-4 w-4 text-champagne-700" />
                {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
              </li>
            ) : null}
            {area ? (
              <li className="flex items-center gap-1.5">
                <IconArea className="h-4 w-4 text-champagne-700" />
                {area}
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <p className="font-display text-2xl font-semibold text-navy-900">{price}</p>
          <span className="text-[0.7rem] uppercase tracking-[0.14em] text-charcoal-500">Ref {property.reference}</span>
        </div>
      </div>
    </article>
  );
}

export function PropertyGrid({ properties, priorityCount = 0 }: { properties: PropertyCardData[]; priorityCount?: number }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 lg:gap-8">
      {properties.map((p, i) => (
        <li key={p.id} className="flex">
          <div className="w-full">
            <PropertyCard property={p} priority={i < priorityCount} />
          </div>
        </li>
      ))}
    </ul>
  );
}
