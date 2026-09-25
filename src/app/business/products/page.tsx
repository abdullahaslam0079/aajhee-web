"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Empty, ErrorBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

type Product = {
  id: number;
  name: string;
  base_price: string;
  sale_price?: string | null;
  has_discount?: boolean;
  effective_price?: string;
  category_name?: string;
};

export default function BusinessProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);

  function load() {
    api<Product[]>("/api/business/products", { auth: true })
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => setError(errorMessage(err)));
  }

  useEffect(() => {
    load();
    api<Array<{ id: number; name: string }>>("/api/categories")
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCategories(list);
        if (list[0]) setCategoryId(String(list[0].id));
      })
      .catch(() => undefined);
  }, []);

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/business/products", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          name,
          base_price: basePrice,
          category_id: Number(categoryId),
        }),
      });
      setName("");
      setBasePrice("");
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader title="Products" subtitle="Catalog with optional discounts" />
      {error ? <ErrorBox message={error} /> : null}
      <form onSubmit={createProduct} className="mb-6 grid gap-3 rounded-2xl bg-white p-5 shadow-card md:grid-cols-4">
        <input
          className="rounded-xl border border-line px-3 py-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="rounded-xl border border-line px-3 py-2"
          placeholder="Base price"
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
          required
        />
        <select
          className="rounded-xl border border-line px-3 py-2"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="rounded-xl bg-deal px-4 py-2 font-semibold text-white" type="submit">
          Add product
        </button>
      </form>
      {products.length === 0 ? (
        <Empty title="No products yet" />
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl bg-white p-4 shadow-card">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-muted">
                {p.category_name} ·{" "}
                {p.has_discount ? `${p.effective_price} (was ${p.base_price})` : p.base_price}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-sm text-muted">
        <Link href="/business" className="text-deal font-semibold">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
