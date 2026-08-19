"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OfferCard } from "@/components/OfferCard";
import { Empty, ErrorBox } from "@/components/ui";
import { api, pageResults } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { km, percent } from "@/lib/format";
import { useAuth } from "@/lib/useAuth";
import type { MapBranch, Offer, Paginated } from "@/lib/types";

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { loggedIn } = useAuth();
  const [branch, setBranch] = useState<MapBranch | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError("");
      try {
        const [branchPage, offerPage] = await Promise.all([
          api<Paginated<MapBranch>>("/api/map/branches", { query: { branch_id: id, page_size: 1 } }),
          api<Paginated<Offer>>(`/api/branch/${id}/offers`, { query: { page_size: 40 } }),
        ]);
        if (cancelled) return;
        setBranch(pageResults(branchPage)[0] || null);
        setOffers(pageResults(offerPage));
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Could not load this store."));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function toggleLike() {
    if (!loggedIn) return;
    try {
      const data = await api<{ is_liked: boolean }>(`/api/branches/${id}/like`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ liked: !liked }),
      });
      setLiked(data.is_liked);
    } catch {
      /* ignore */
    }
  }

  const cover =
    branch?.highest_discount_offer?.image_urls?.[0] || branch?.business_logo_url || "";

  return (
    <div>
      {error ? <ErrorBox message={error} /> : null}
      <div className="overflow-hidden rounded-2xl bg-white shadow-card outline outline-1 outline-black/5">
        <div className="relative h-60 bg-paper">
          {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : (
            <div className="grid h-full place-items-center bg-deal-soft text-4xl font-extrabold text-deal">
              {(branch?.business_name || "G").slice(0, 1)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
          {branch?.highest_discount_percent ? (
            <span className="absolute left-3 top-3 rounded-full bg-deal px-2.5 py-1 text-xs font-extrabold text-white shadow-sm">
              {percent(branch.highest_discount_percent)} Off
            </span>
          ) : null}
        </div>
        <div className="flex items-start justify-between gap-3 p-5">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{branch?.business_name || "Store"}</h1>
            <p className="text-sm text-muted">{branch?.name}</p>
            <p className="mt-1 text-sm text-muted">
              {branch?.formattedAddress}
              {branch?.distance_km != null ? ` · ${km(branch.distance_km)}` : ""}
            </p>
          </div>
          {loggedIn ? (
            <button
              type="button"
              onClick={toggleLike}
              className={`rounded-xl px-3.5 py-1.5 text-sm font-bold ${
                liked ? "bg-deal-deep text-white shadow-sm" : "bg-paper"
              }`}
            >
              {liked ? "Saved" : "Save"}
            </button>
          ) : null}
        </div>
      </div>

      <h2 className="mb-3 mt-6 font-display text-xl font-semibold tracking-tight">Offers</h2>
      {offers.length === 0 ? (
        <Empty title="No offers at this branch" />
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
