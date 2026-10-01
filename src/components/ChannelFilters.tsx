"use client";

import { useEffect, useMemo, useState } from "react";
import { GlobeIcon, StoreIcon } from "@/components/icons";
import { api } from "@/lib/api";
import type { CategoryTreeNode } from "@/lib/types";

/** For business/store discovery, map an L2 selection back to its root vertical. */
export function rootCategoryId(
  tree: CategoryTreeNode[],
  categoryId: number | null
): number | null {
  if (categoryId == null) return null;
  for (const root of tree) {
    if (root.id === categoryId) return root.id;
    if (root.children?.some((c) => c.id === categoryId)) return root.id;
  }
  return categoryId;
}

export function ChannelFilters({
  value,
  onChange,
  categories,
  categoryId,
  onCategory,
  showChannels = true,
  showSubcategories = true,
}: {
  value: "all" | "online" | "inStore";
  onChange: (value: "all" | "online" | "inStore") => void;
  categories?: CategoryTreeNode[];
  categoryId?: number | null;
  onCategory?: (id: number | null) => void;
  showChannels?: boolean;
  showSubcategories?: boolean;
}) {
  const [tree, setTree] = useState<CategoryTreeNode[]>(categories || []);

  useEffect(() => {
    if (categories) {
      setTree(categories);
      return;
    }
    api<CategoryTreeNode[]>("/api/categories/tree", { query: { populated: "1" } })
      .then((data) => setTree(Array.isArray(data) ? data : []))
      .catch(() => setTree([]));
  }, [categories]);

  const roots = tree;
  const selectedRoot = useMemo(() => {
    if (categoryId == null) return null;
    for (const root of roots) {
      if (root.id === categoryId) return root;
      if (root.children?.some((c) => c.id === categoryId)) return root;
    }
    return null;
  }, [roots, categoryId]);

  const children = showSubcategories ? selectedRoot?.children || [] : [];

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
        <div className="space-y-2">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Categories
            </p>
            <div className="hide-scroll flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => onCategory(null)}
                className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                  categoryId == null
                    ? "bg-deal-deep !text-white shadow-sm"
                    : "bg-white text-ink shadow-card outline outline-1 outline-black/5 hover:bg-paper"
                }`}
              >
                All
              </button>
              {roots.map((cat) => {
                const active =
                  categoryId === cat.id ||
                  Boolean(cat.children?.some((c) => c.id === categoryId));
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onCategory(categoryId === cat.id ? null : cat.id)}
                    className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-deal-deep !text-white shadow-sm"
                        : "bg-white text-ink shadow-card outline outline-1 outline-black/5 hover:bg-paper"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
          {children.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                Subcategories
              </p>
              <div className="hide-scroll flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => onCategory(selectedRoot?.id ?? null)}
                  className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    categoryId === selectedRoot?.id
                      ? "bg-ink !text-white shadow-sm"
                      : "bg-white text-ink shadow-card outline outline-1 outline-black/5 hover:bg-paper"
                  }`}
                >
                  All {selectedRoot?.name}
                </button>
                {children.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onCategory(categoryId === cat.id ? selectedRoot?.id ?? null : cat.id)}
                    className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                      categoryId === cat.id
                        ? "bg-ink !text-white shadow-sm"
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
      ) : null}
    </div>
  );
}
