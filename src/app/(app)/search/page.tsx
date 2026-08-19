"use client";

import { useEffect, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { OfferCard } from "@/components/OfferCard";
import { Empty, inputClass } from "@/components/ui";
import { api, pageResults } from "@/lib/api";
import { locationQuery } from "@/lib/location";
import type { Offer, Paginated } from "@/lib/types";
import { useLocation } from "@/lib/useLocation";

export default function SearchPage() {
  const loc = useLocation();
  const [q, setQ] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setOffers([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api<Paginated<Offer>>("/api/offers/search", {
          query: { q: term, page_size: 30, ...locationQuery(loc) },
        });
        setOffers(pageResults(data));
      } catch {
        setOffers([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [q, loc]);

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-semibold tracking-tight">Search</h1>
      <div className="relative mb-5">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className={`${inputClass} pl-11`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search offers, items, or brands"
          autoFocus
        />
      </div>
      {loading ? <p className="text-sm text-muted">Searching…</p> : null}
      {!q ? (
        <p className="text-sm text-muted">Try a brand, product, or store name.</p>
      ) : null}
      {!loading && q && offers.length === 0 ? (
        <Empty title="No matching offers" body="Try a shorter search." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}
