"use client";

import { useEffect, useState } from "react";
import { OfferCard } from "@/components/OfferCard";
import { Empty, ErrorBox } from "@/components/ui";
import { api, pageResults } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { locationQuery } from "@/lib/location";
import type { Offer, Paginated } from "@/lib/types";
import { useLocation } from "@/lib/useLocation";

export default function TopPicksPage() {
  const loc = useLocation();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Paginated<Offer>>("/api/offers/discounts", {
      query: { ...locationQuery(loc), page_size: 40 },
    })
      .then((data) => setOffers(pageResults(data)))
      .catch((err) => setError(errorMessage(err)));
  }, [loc]);

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-semibold tracking-tight">Top picks</h1>
      {error ? <ErrorBox message={error} /> : null}
      {offers.length === 0 && !error ? (
        <Empty title="No top picks yet" />
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
