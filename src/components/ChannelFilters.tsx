"use client";

import { useEffect, useState } from "react";
import { GlobeIcon, StoreIcon } from "@/components/icons";
import { api, pageResults } from "@/lib/api";
import type { Category } from "@/lib/types";

export function ChannelFilters({
  value,
  onChange,
  categories,
  categoryId,
  onCategory,
  showChannels = true,
}: {
  value: "all" | "online" | "inStore";
  onChange: (value: "all" | "online" | "inStore") => void;
  categories?: Category[];
  categoryId?: number | null;
  onCategory?: (id: number | null) => void;
  showChannels?: boolean;
}) {
  const [loaded, setLoaded] = useState<Category[]>(categories || []);

  useEffect(() => {
    if (categories) return;
    api<Category[]>("/api/categories")
      .then((data) => setLoaded(Array.isArray(data) ? data : pageResults(data as never)))
      .catch(() => setLoaded([]));
  }, [categories]);

  const chips: { id: "all" | "online" | "inStore"; label: string; icon?: React.ReactNode }[] = [
    { id: "all", label: "All" },
    { id: "online", label: "Online", icon: <GlobeIcon /> },
    { id: "inStore", label: "In-store", icon: <StoreIcon size={13} /> },
  ];

  return (
    <div className="space-y-3">
      {showChannels ? (
        <div className="inline-flex max-w-full rounded-xl bg-white p-1 shadow-card outline outline-1 outline-black/5">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChange(chip.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                value === chip.id ? "bg-ink !text-white shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {chip.icon}
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}
      {onCategory ? (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Categories</p>
          <div className="hide-scroll flex gap-2 overflow-x-auto pb-1">
            {loaded.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategory(categoryId === cat.id ? null : cat.id)}
                className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                  categoryId === cat.id
                    ? "bg-deal-deep !text-white shadow-sm"
                    : "bg-white text-ink shadow-card outline outline-1 outline-black/5 hover:bg-paper"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
