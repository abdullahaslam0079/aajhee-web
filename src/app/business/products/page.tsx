"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Badge,
  ConfirmDialog,
  Empty,
  ErrorBox,
  PageHeader,
  Toggle,
} from "@/components/ui";
import { api, pageResults } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { rs } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function BusinessProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function load() {
    api<Product[] | { results: Product[] }>("/api/business/products", { auth: true })
      .then((data) => setProducts(pageResults(data)))
      .catch((err) => setError(errorMessage(err)));
  }

  useEffect(() => {
    load();
  }, []);

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
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
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
      {products.length === 0 ? (
        <Empty title="No listings yet" body="Add your first product with photos and price." />
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <article key={p.id} className="card flex flex-wrap items-center gap-3 p-4">
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
