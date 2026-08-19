"use client";

import { useEffect, useState } from "react";
import { ChannelFilters } from "@/components/ChannelFilters";
import { HomeToolbar } from "@/components/HomeToolbar";
import { StoreCard } from "@/components/StoreCard";
import { Empty, ErrorBox, Skeleton } from "@/components/ui";
import { api, pageResults } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { locationQuery } from "@/lib/location";
import type { MapBranch, Paginated } from "@/lib/types";
import { useLocation } from "@/lib/useLocation";

export default function StoresPage() {
  const loc = useLocation();
  const [branches, setBranches] = useState<MapBranch[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api<Paginated<MapBranch>>("/api/map/branches", {
          query: { ...locationQuery(loc), page_size: 40, category_id: categoryId },
        });
        if (!cancelled) setBranches(pageResults(data));
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Could not load stores."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [loc, categoryId]);

  return (
    <div>
      <HomeToolbar />
      <h1 className="mb-4 font-display text-2xl font-semibold tracking-tight">Stores</h1>
      <div className="mb-4">
        <ChannelFilters value="all" onChange={() => undefined} showChannels={false} categoryId={categoryId} onCategory={setCategoryId} />
      </div>
      {error ? <ErrorBox message={error} /> : null}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-56" />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <Empty title="No stores found" body="Deals will show up here when merchants go live near you." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {branches.map((branch) => (
            <StoreCard key={branch.id} branch={branch} />
          ))}
        </div>
      )}
    </div>
  );
}
