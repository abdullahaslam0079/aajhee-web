import Link from "next/link";
import { GlobeIcon, StoreIcon } from "@/components/icons";
import { Cover, cardClass } from "@/components/ui";
import type { Offer } from "@/lib/types";
import { channelOf, km, money, offerImage, percent, savings } from "@/lib/format";

function rememberOffer(offer: Offer) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`aajhee.offer.${offer.id}`, JSON.stringify(offer));
}

function ChannelBadge({ channel }: { channel: "online" | "inStore" }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
      {channel === "online" ? <GlobeIcon /> : <StoreIcon size={12} />}
      {channel === "online" ? "Online" : "In-store"}
    </span>
  );
}

function Price({ offer }: { offer: Offer }) {
  const off = percent(offer.discount_percent);
  const saved = savings(offer.original_price, offer.discounted_price);
  return (
    <div className="mt-1.5">
      <p className="flex items-baseline gap-2">
        <span className="text-sm font-extrabold text-deal">
          {money(offer.discounted_price) || (off ? `Save ${off}` : "Deal")}
        </span>
        {offer.original_price ? (
          <span className="text-xs text-muted line-through">{money(offer.original_price)}</span>
        ) : null}
      </p>
      {saved ? <p className="text-[11px] font-bold text-deal">You save {saved}</p> : null}
    </div>
  );
}

export function OfferCard({
  offer,
  variant = "list",
}: {
  offer: Offer;
  variant?: "list" | "pick";
}) {
  const img = offerImage(offer);
  const off = percent(offer.discount_percent);
  const channel = channelOf(offer);
  const href = `/offers/${offer.id}`;

  if (variant === "pick") {
    return (
      <Link
        href={href}
        onClick={() => rememberOffer(offer)}
        className={`${cardClass} w-[210px] shrink-0 snap-start overflow-hidden sm:w-[230px]`}
      >
        <div className="relative h-44 overflow-hidden bg-paper">
          <Cover src={img} label={offer.business_name} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
          <div className="absolute left-2 top-2">
            {off ? (
              <span className="rounded-full bg-deal px-2 py-0.5 text-[11px] font-extrabold text-white shadow-sm">
                {off} OFF
              </span>
            ) : null}
          </div>
          <div className="absolute right-2 top-2">
            <ChannelBadge channel={channel} />
          </div>
        </div>
        <div className="p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-deal">
            {offer.business_logo_url ? (
              <img src={offer.business_logo_url} alt="" className="h-4 w-4 rounded object-cover" />
            ) : null}
            <span className="truncate">{offer.business_name}</span>
          </p>
          <p className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-snug">{offer.title}</p>
          <Price offer={offer} />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={() => rememberOffer(offer)}
      className={`${cardClass} flex gap-3 p-3`}
    >
      <div className="relative h-[6.75rem] w-[6.75rem] shrink-0 overflow-hidden rounded-xl bg-paper">
        <Cover src={img} label={offer.business_name} />
        {off ? (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-deal px-1.5 py-0.5 text-[10px] font-extrabold text-white">
            {off}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="flex items-center gap-2 text-[13px] font-bold text-deal">
          {offer.business_logo_url ? (
            <img src={offer.business_logo_url} alt="" className="h-5 w-5 rounded-md object-cover" />
          ) : null}
          <span className="truncate">{offer.business_name}</span>
        </p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink">{offer.title}</p>
        <p className="mt-1 truncate text-xs text-muted">
          {channel === "online" ? "Online" : "In-store"}
          {offer.category_name ? ` · ${offer.category_name}` : ""}
          {offer.nearest_distance_km != null ? ` · ${km(offer.nearest_distance_km)}` : ""}
        </p>
        <Price offer={offer} />
      </div>
    </Link>
  );
}
