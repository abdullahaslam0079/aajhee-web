import Link from "next/link";
import { cardClass } from "@/components/ui";
import { ArrowRightIcon, ChevronIcon, HeartIcon, PackageIcon, PinIcon } from "@/components/icons";
import type { MapBranch } from "@/lib/types";
import { km } from "@/lib/format";

export function StoreCard({ branch }: { branch: MapBranch }) {
  const name = branch.business_name || branch.name;
  const category = branch.category_name?.trim() || "";
  const distance = branch.distance_km != null ? km(branch.distance_km) : "";
  const products = (branch.top_products || []).slice(0, 8);
  const count = branch.products_count ?? 0;
  const ctaLabel = count > 0 ? `View all products (${count})` : "View all products";
  const ratingAvg = branch.rating_avg;
  const ratingCount = branch.rating_count;
  const showRating =
    ratingAvg != null && (ratingCount == null || ratingCount > 0);

  return (
    <Link
      href={`/stores/${branch.id}`}
      className={`${cardClass} overflow-hidden bg-[#f3f3f5] shadow-none outline-none ring-0`}
    >
      <div className="p-3.5 pb-3">
        <div className="flex items-start gap-3">
          {branch.business_logo_url ? (
            <img
              src={branch.business_logo_url}
              alt=""
              className="h-[52px] w-[52px] shrink-0 rounded-xl object-cover ring-1 ring-black/5"
            />
          ) : (
            <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-xl bg-deal-soft text-sm font-extrabold text-deal">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold tracking-tight text-ink">
              {name}
            </p>
            {showRating ? (
              <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-ink">
                <span className="text-amber-400" aria-hidden>
                  ★
                </span>
                <span>{Number(ratingAvg).toFixed(1)}</span>
                {ratingCount != null && ratingCount > 0 ? (
                  <span className="font-medium text-muted">({ratingCount})</span>
                ) : null}
              </p>
            ) : null}
            {category ? (
              <p className="mt-0.5 truncate text-xs font-medium text-muted">{category}</p>
            ) : null}
            {distance ? (
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-muted">
                <PinIcon size={12} className="shrink-0 text-muted" />
                {distance}
              </p>
            ) : null}
          </div>

          <span
            className="mt-0.5 grid h-8 w-8 place-items-center rounded-full text-muted"
            aria-hidden
          >
            <HeartIcon size={20} />
          </span>
        </div>

        {products.length > 0 ? (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-black/5"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted/50">
                      <PackageIcon size={18} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-muted shadow-sm ring-1 ring-black/5"
              aria-hidden
            >
              <ChevronIcon size={18} />
            </span>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-center gap-2 rounded-full bg-deal-soft/80 px-4 py-3 text-sm font-bold text-deal">
          <PackageIcon size={16} />
          <span className="truncate">{ctaLabel}</span>
          <ArrowRightIcon size={14} />
        </div>
      </div>
    </Link>
  );
}
