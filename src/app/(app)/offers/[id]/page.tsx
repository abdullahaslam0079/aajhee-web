"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, ErrorBox } from "@/components/ui";
import { BackIcon, HeartIcon } from "@/components/icons";
import { api, pageResults } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { channelOf, money, offerImage, percent, savings } from "@/lib/format";
import { useAuth } from "@/lib/useAuth";
import type { Offer, Paginated } from "@/lib/types";

export default function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { loggedIn } = useAuth();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const cached = sessionStorage.getItem(`goluto.offer.${id}`);
        if (cached) {
          const parsed = JSON.parse(cached) as Offer;
          if (!cancelled) {
            setOffer(parsed);
            setLiked(Boolean(parsed.is_liked));
            setLikes(parsed.like_count || 0);
          }
        }
        const data = await api<Paginated<Offer>>("/api/offers", {
          query: { page_size: 80 },
        });
        const found = pageResults(data).find((item) => String(item.id) === String(id)) || null;
        if (!found) {
          const search = await api<Paginated<Offer>>("/api/offers/search", {
            query: { q: id, page_size: 20 },
          });
          const match = pageResults(search).find((item) => String(item.id) === String(id));
          if (cancelled) return;
          setOffer(match || null);
          setLiked(Boolean(match?.is_liked));
          setLikes(match?.like_count || 0);
        } else {
          if (cancelled) return;
          setOffer(found);
          setLiked(Boolean(found.is_liked));
          setLikes(found.like_count || 0);
        }
        api(`/api/offers/${id}/view`, { method: "POST" }).catch(() => undefined);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Could not load this offer."));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function toggleLike() {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    try {
      const data = await api<{ is_liked: boolean; like_count: number }>(`/api/offers/${id}/like`, {
        method: "POST",
        auth: true,
      });
      setLiked(data.is_liked);
      setLikes(data.like_count);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (!offer && !error) return <p className="text-sm text-muted">Loading offer…</p>;
  if (!offer) return <ErrorBox message={error || "Offer not found."} />;

  const img = offerImage(offer);
  const channel = channelOf(offer);
  const shopLabel = offer.external_url_label || (channel === "online" ? "Go to shop" : "View offer");
  const off = percent(offer.discount_percent);
  const saved = savings(offer.original_price, offer.discounted_price);
  const shopHref = channel === "online" ? offer.external_url : null;

  function ShopCta() {
    if (!shopHref) return null;
    return (
      <a
        href={shopHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex flex-1 items-center justify-center rounded-xl bg-deal-deep px-4 py-3 text-sm font-bold !text-white shadow-sm"
      >
        {shopLabel}
      </a>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-24 md:pb-0">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <BackIcon /> Back to offers
      </Link>
      {error ? (
        <div className="mb-3">
          <ErrorBox message={error} />
        </div>
      ) : null}
      <div className="overflow-hidden rounded-2xl bg-white shadow-card outline outline-1 outline-black/5 md:grid md:grid-cols-2">
        <div className="relative min-h-72 bg-paper md:min-h-full">
          {img ? (
            <img src={img} alt="" className="h-full w-full object-cover md:absolute md:inset-0" />
          ) : (
            <div className="grid h-72 place-items-center bg-gradient-to-br from-deal-soft to-[#dfc4c4] text-4xl font-extrabold text-deal md:h-full">
              {offer.business_name.slice(0, 1)}
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-1">
            {off ? (
              <span className="rounded-full bg-deal px-2.5 py-1 text-xs font-extrabold text-white shadow-sm">
                {off} OFF
              </span>
            ) : null}
            <span className="rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {channel === "online" ? "Online" : "In-store"}
            </span>
          </div>
        </div>
        <div className="p-5 md:p-7">
          <p className="text-sm font-bold uppercase tracking-wide text-deal">{offer.business_name}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">{offer.title}</h1>
          <p className="mt-3 text-2xl font-extrabold text-deal">
            {money(offer.discounted_price) || off || "Deal"}
            {offer.original_price ? (
              <span className="ml-2 text-base font-medium text-muted line-through">
                {money(offer.original_price)}
              </span>
            ) : null}
          </p>
          {saved ? <p className="mt-1 text-sm font-bold text-deal">You save {saved}</p> : null}
          {offer.description ? <p className="mt-4 text-sm leading-6 text-muted">{offer.description}</p> : null}
          {offer.detailed_description ? (
            <p className="mt-2 text-sm leading-6">{offer.detailed_description}</p>
          ) : null}
          {offer.included_items?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {offer.included_items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 hidden flex-wrap gap-2 md:flex">
            <Button type="button" variant="ghost" onClick={toggleLike}>
              <HeartIcon filled={liked} /> {liked ? "Liked" : "Like"} · {likes}
            </Button>
            <ShopCta />
            {offer.featured_branch ? (
              <Link
                href={`/stores/${offer.featured_branch.id}`}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-line"
              >
                {offer.featured_branch.name}
              </Link>
            ) : null}
          </div>

          {channel === "inStore" ? (
            <p className="mt-5 rounded-xl bg-deal-soft p-3 text-sm text-deal-ink">
              Show this deal in the store. Scanning from the web app is not used — ask staff
              to apply the discount at the counter.
            </p>
          ) : null}
        </div>
      </div>
      <div className="fixed inset-x-3 bottom-[5.25rem] z-20 flex gap-2 md:hidden">
        <Button type="button" variant="ghost" className="bg-white/95 shadow-lift" onClick={toggleLike}>
          <HeartIcon filled={liked} />
        </Button>
        {shopHref ? (
          <ShopCta />
        ) : (
          <div className="flex-1 rounded-xl bg-ink px-4 py-3 text-center text-sm font-bold text-white shadow-lift">
            Show in store
          </div>
        )}
      </div>
    </div>
  );
}
