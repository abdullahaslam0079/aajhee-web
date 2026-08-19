"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChannelFilters } from "@/components/ChannelFilters";
import { DiscoverMap } from "@/components/DiscoverMap";
import { HomeToolbar } from "@/components/HomeToolbar";
import { StoreCard } from "@/components/StoreCard";
import { Empty, ErrorBox } from "@/components/ui";
import { api, pageResults } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { locationQuery, requestBrowserLocation } from "@/lib/location";
import type { MapBranch, Paginated } from "@/lib/types";
import { useLocation } from "@/lib/useLocation";

export default function DiscoverPage() {
  const loc = useLocation();
  const router = useRouter();
  const [branches, setBranches] = useState<MapBranch[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(
    () => ({ ...locationQuery(loc), page_size: 80, category_id: categoryId }),
    [loc, categoryId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<Paginated<MapBranch>>("/api/map/nearby", { query });
      setBranches(pageResults(data));
    } catch (err) {
      setError(errorMessage(err, "Could not load nearby stores."));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <HomeToolbar />
      <div className="mb-4">
        <h1 className="font-display text-[1.85rem] font-semibold tracking-tight">Discover</h1>
        <p className="text-sm text-muted">Stores with live deals around you</p>
      </div>
      <div className="mb-4">
        <ChannelFilters value="all" onChange={() => undefined} showChannels={false} categoryId={categoryId} onCategory={setCategoryId} />
      </div>
      {error ? <ErrorBox message={error} onRetry={load} /> : null}
      <div className="relative">
        <DiscoverMap
          branches={branches}
          center={loc}
          onSelect={(branch) => router.push(`/stores/${branch.id}`)}
        />
        <button
          type="button"
          className="absolute bottom-4 left-1/2 z-[500] -translate-x-1/2 rounded-xl bg-white px-4 py-2 text-sm font-bold shadow-lift outline outline-1 outline-black/5"
          onClick={() => requestBrowserLocation().then(() => load()).catch(() => undefined)}
        >
          Use my location
        </button>
      </div>
      <h2 className="mb-3 mt-6 font-display text-xl font-semibold tracking-tight">Nearby stores</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {branches.map((branch) => (
          <StoreCard key={branch.id} branch={branch} />
        ))}
      </div>
      {!loading && branches.length === 0 ? (
        <div className="mt-4">
          <Empty title="No stores nearby" body="Try a different location or category." />
        </div>
      ) : null}
    </div>
  );
}
