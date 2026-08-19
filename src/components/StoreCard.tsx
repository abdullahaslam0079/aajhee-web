import Link from "next/link";
import { Cover, cardClass } from "@/components/ui";
import type { MapBranch } from "@/lib/types";
import { km, percent } from "@/lib/format";

export function StoreCard({ branch }: { branch: MapBranch }) {
  const cover =
    branch.highest_discount_offer?.image_urls?.[0] || branch.business_logo_url || "";
  const off = percent(branch.highest_discount_percent);
  return (
    <Link href={`/stores/${branch.id}`} className={`${cardClass} overflow-hidden`}>
      <div className="relative h-48 overflow-hidden bg-paper">
        <Cover src={cover} label={branch.business_name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        {off ? (
          <span className="absolute left-3 top-3 rounded-full bg-deal px-2.5 py-1 text-xs font-extrabold text-white shadow-sm">
            {off} Off
          </span>
        ) : null}
        <p className="absolute bottom-3 left-3 right-3 truncate font-display text-lg font-semibold text-white">
          {branch.business_name}
        </p>
      </div>
      <div className="flex items-center gap-3 p-3.5">
        {branch.business_logo_url ? (
          <img src={branch.business_logo_url} alt="" className="h-11 w-11 rounded-xl object-cover ring-1 ring-black/5" />
        ) : (
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-deal-soft text-sm font-extrabold text-deal">
            {branch.business_name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{branch.name || branch.business_name}</p>
          <p className="truncate text-xs text-muted">
            {branch.distance_km != null ? km(branch.distance_km) : ""}
            {branch.category_name ? `${branch.distance_km != null ? " · " : ""}${branch.category_name}` : ""}
          </p>
          <p className="truncate text-xs text-muted">{branch.formattedAddress}</p>
        </div>
      </div>
    </Link>
  );
}
