import { IconBuilding } from "@/components/icons";

export function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="bg-architectural absolute inset-0 flex flex-col items-center justify-center gap-3 text-champagne-300/80">
      <IconBuilding className="h-10 w-10" />
      <span className="text-xs uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
}
