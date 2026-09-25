"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChannelFilters } from "@/components/ChannelFilters";
import { HomeToolbar } from "@/components/HomeToolbar";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";
import { OfferCard } from "@/components/OfferCard";
import { Empty, ErrorBox, SectionHeader, Skeleton } from "@/components/ui";
import { api, pageResults } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { locationQuery } from "@/lib/location";
import type { Channel, Offer, Paginated } from "@/lib/types";
import { useLocation } from "@/lib/useLocation";

export default function HomePage() {
  const loc = useLocation();
  const [picks, setPicks] = useState<Offer[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [channel, setChannel] = useState<Channel>("all");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [picksLoading, setPicksLoading] = useState(true);
  const [offersLoading, setOffersLoading] = useState(true);
  const [error, setError] = useState("");

  const [productFeeds, setProductFeeds] = useState<{
    top_picks: Array<Record<string, unknown>>;
    offers: Array<Record<string, unknown>>;
    trending: Array<Record<string, unknown>>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadFeeds() {
      try {
        const feeds = await api<{
          top_picks: Array<Record<string, unknown>>;
          offers: Array<Record<string, unknown>>;
          trending: Array<Record<string, unknown>>;
        }>("/api/feeds/home", {
          query: locationQuery(loc),
        });
        if (!cancelled) setProductFeeds(feeds);
      } catch {
        // Keep legacy offer home if product feeds unavailable.
      }
    }
    loadFeeds();
    return () => {
      cancelled = true;
    };
  }, [loc.latitude, loc.longitude]);

  useEffect(() => {
    let cancelled = false;
    async function loadPicks() {
      setPicksLoading(true);
      try {
        const top = await api<Paginated<Offer>>("/api/offers/discounts", {
          query: { ...locationQuery(loc), page_size: 40 },
        });
        if (!cancelled) setPicks(pageResults(top));
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Could not load offers."));
      } finally {
        if (!cancelled) setPicksLoading(false);
      }
    }
    loadPicks();
    return () => {
      cancelled = true;
    };
  }, [loc.latitude, loc.longitude]);

  useEffect(() => {
    let cancelled = false;
    async function loadOffers() {
      setOffersLoading(true);
      setError("");
      try {
        const all = await api<Paginated<Offer>>("/api/offers", {
          query: { ...locationQuery(loc), page_size: 40, category_id: categoryId },
        });
        if (!cancelled) setOffers(pageResults(all));
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Could not load offers."));
      } finally {
        if (!cancelled) setOffersLoading(false);
      }
    }
    loadOffers();
    return () => {
      cancelled = true;
    };
  }, [loc.latitude, loc.longitude, categoryId]);

  const visible = useMemo(() => {
    if (channel === "all") return offers;
    return offers.filter((offer) => (channel === "online" ? offer.is_online : !offer.is_online));
  }, [offers, channel]);

  return (
    <div>
      <HomeToolbar />
      <Link
        href="/search"
        className="mb-6 flex items-center gap-3 rounded-xl bg-white px-4 py-3.5 text-sm text-muted shadow-card outline outline-1 outline-black/5 transition hover:shadow-lift lg:hidden"
      >
        <SearchIcon className="shrink-0 text-ink/50" />
        Search products and stores
      </Link>

      {productFeeds ? (
        <>
          {(["top_picks", "offers", "trending"] as const).map((key) => {
            const title =
              key === "top_picks" ? "Top picks" : key === "offers" ? "Offers" : "Trending";
            const items = productFeeds[key] || [];
            if (!items.length) return null;
            return (
              <div key={key} className="mb-8">
                <SectionHeader title={title} subtitle="From the product catalog" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => (
                    <div
                      key={String(p.id)}
                      className="rounded-2xl bg-white p-4 shadow-card outline outline-1 outline-black/5"
                    >
                      <p className="font-semibold">{String(p.name || "")}</p>
                      <p className="text-sm text-muted">
                        {p.has_discount
                          ? `Rs ${String(p.effective_price)} · ${String(p.effective_discount_percent)}% off`
                          : `Rs ${String(p.base_price || "")}`}
                      </p>
                      <p className="mt-1 text-xs text-muted">{String(p.business_name || "")}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      ) : null}

      <SectionHeader
        title="Legacy offers"
        subtitle="Still available during transition"
        action={
          <Link href="/picks" className="inline-flex items-center gap-1 text-sm font-bold text-deal hover:text-deal-deep">
            View all <ArrowRightIcon size={14} />
          </Link>
        }
      />
      <div className="relative mb-8">
        <div className="hide-scroll -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
          {picksLoading && picks.length === 0
            ? [0, 1, 2].map((key) => <Skeleton key={key} className="h-72 w-[210px] shrink-0 sm:w-[230px]" />)
            : null}
          {picks.map((offer) => (
            <OfferCard key={offer.id} offer={offer} variant="pick" />
          ))}
          {!picksLoading && picks.length === 0 ? (
            <p className="py-8 text-sm text-muted">No spotlight deals near Berlin yet.</p>
          ) : null}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-12 bg-gradient-to-l from-paper to-transparent md:block" />
      </div>

      <div className="sticky top-[57px] z-20 -mx-4 mb-4 border-b border-line/70 bg-paper/95 px-4 py-3 backdrop-blur-xl">
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <h2 className="font-display text-xl font-semibold tracking-tight">All offers</h2>
          {!offersLoading ? (
            <p className="text-sm font-medium text-muted">
              {visible.length} {visible.length === 1 ? "deal" : "deals"}
            </p>
          ) : null}
        </div>
        <ChannelFilters
          value={channel}
          onChange={setChannel}
          categoryId={categoryId}
          onCategory={setCategoryId}
        />
      </div>

      {error ? <ErrorBox message={error} /> : null}
      {offersLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <Skeleton key={key} className="h-28" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Empty title="No offers yet" body="Try another filter or check back soon." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}
