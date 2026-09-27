"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Badge,
  Button,
  ConfirmDialog,
  Empty,
  ErrorBox,
  Field,
  PageHeader,
  Toggle,
  inputClass,
} from "@/components/ui";
import { api, pageResults } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { rs } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductsClient() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [enabledFilter, setEnabledFilter] = useState("");
  const [discountFilter, setDiscountFilter] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(
    searchParams.get("stock") === "low" ? "true" : "",
  );
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkPercent, setBulkPercent] = useState("10");
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(() => {
    api<Product[] | { results: Product[] }>("/api/business/products", {
      auth: true,
      query: {
        search: search || undefined,
        is_enabled: enabledFilter || undefined,
        has_discount: discountFilter || undefined,
        low_stock: lowStockFilter || undefined,
      },
    })
      .then((data) => setProducts(pageResults(data)))
      .catch((err) => setError(errorMessage(err)));
  }, [search, enabledFilter, discountFilter, lowStockFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  function toggleSelect(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAll() {
    if (selected.length === products.length) setSelected([]);
    else setSelected(products.map((p) => p.id));
  }

  async function toggleEnabled(product: Product, is_enabled: boolean) {
    setBusyId(product.id);
    setError("");
    try {
      await api(`/api/business/products/${product.id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ is_enabled }),
      });
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number) {
    setBusyId(id);
    setError("");
    try {
      await api(`/api/business/products/${id}`, { method: "DELETE", auth: true });
      setDeleteId(null);
      setSelected((prev) => prev.filter((x) => x !== id));
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function applyBulkDiscount(allProducts = false) {
    const percent = Number(bulkPercent);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      setError("Enter a discount between 0.01 and 100.");
      return;
    }
    if (!allProducts && selected.length === 0) {
      setError("Select at least one listing, or apply to all.");
      return;
    }
    setBulkBusy(true);
    setError("");
    try {
      await api("/api/business/products/bulk-discount", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          discount_percent: percent,
          product_ids: allProducts ? [] : selected,
          all_products: allProducts,
        }),
      });
      setSelected([]);
      load();
    } catch (err) {
      setError(errorMessage(err, "Could not apply bulk discount."));
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Listings"
        subtitle="Products customers can order — edit details, stock, photos, and discounts"
        action={{ href: "/business/products/new", label: "Add listing" }}
      />
      {error ? <ErrorBox message={error} /> : null}

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className={`${inputClass} min-w-[200px] flex-1`}
          placeholder="Search listings…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          className={`${inputClass} w-auto`}
          value={enabledFilter}
          onChange={(e) => setEnabledFilter(e.target.value)}
        >
          <option value="">All visibility</option>
          <option value="true">Live only</option>
          <option value="false">Hidden only</option>
        </select>
        <select
          className={`${inputClass} w-auto`}
          value={discountFilter}
          onChange={(e) => setDiscountFilter(e.target.value)}
        >
          <option value="">All prices</option>
          <option value="true">On sale</option>
          <option value="false">Full price</option>
        </select>
        <select
          className={`${inputClass} w-auto`}
          value={lowStockFilter}
          onChange={(e) => setLowStockFilter(e.target.value)}
        >
          <option value="">All stock</option>
          <option value="true">Low stock (≤5)</option>
        </select>
      </div>

      {products.length > 0 ? (
        <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={selected.length === products.length && products.length > 0}
              onChange={toggleSelectAll}
            />
            Select all ({selected.length})
          </label>
          <Field label="Bulk discount %">
            <input
              className={`${inputClass} w-28`}
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              value={bulkPercent}
              onChange={(e) => setBulkPercent(e.target.value)}
            />
          </Field>
          <Button
            type="button"
            disabled={bulkBusy || selected.length === 0}
            onClick={() => void applyBulkDiscount(false)}
          >
            {bulkBusy ? "Applying…" : `Apply to selected`}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={bulkBusy}
            onClick={() => void applyBulkDiscount(true)}
          >
            Apply to all listings
          </Button>
        </div>
      ) : null}

      {products.length === 0 ? (
        <Empty
          title="No listings yet"
          body={
            search || enabledFilter || discountFilter || lowStockFilter
              ? "No listings match these filters."
              : "Add your first product with photos and price."
          }
        />
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <article key={p.id} className="card flex flex-wrap items-center gap-3 p-4">
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={() => toggleSelect(p.id)}
                aria-label={`Select ${p.name}`}
              />
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-xl bg-paper text-sm font-bold text-deal">
                  {p.name.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/business/products/${p.id}`} className="font-semibold hover:text-deal">
                    {p.name}
                  </Link>
                  <Badge tone={p.is_enabled === false ? "neutral" : "success"}>
                    {p.is_enabled === false ? "Hidden" : "Live"}
                  </Badge>
                  {p.is_available === false ? <Badge tone="warning">Unavailable</Badge> : null}
                  {p.has_discount ? <Badge tone="deal">On sale</Badge> : null}
                  {p.is_low_stock ? (
                    <Badge tone="warning">
                      {p.stock_quantity === 0 ? "Out of stock" : `Low stock · ${p.stock_quantity}`}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted">
                  {p.category_name || "Uncategorized"} ·{" "}
                  {p.has_discount
                    ? `${rs(p.effective_price)} (was ${rs(p.base_price)})`
                    : rs(p.base_price)}
                  {p.stock_quantity != null ? ` · Stock ${p.stock_quantity}` : ""}
                  {p.order_count ? ` · ${p.order_count} orders` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Toggle
                  checked={p.is_enabled !== false}
                  onChange={(value) => void toggleEnabled(p, value)}
                  label={busyId === p.id ? "…" : "Enabled"}
                />
                <Link
                  href={`/business/products/${p.id}`}
                  className="text-sm font-semibold text-deal"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="text-sm font-semibold text-red-600"
                  onClick={() => setDeleteId(p.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {deleteId != null ? (
        <ConfirmDialog
          title="Delete listing?"
          message="This removes the product from your catalog. Existing order history is kept."
          confirmLabel="Delete"
          cancelLabel="Keep"
          danger
          onCancel={() => setDeleteId(null)}
          onConfirm={() => void remove(deleteId)}
        />
      ) : null}
    </div>
  );
}
