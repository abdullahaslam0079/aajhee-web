"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Empty, ErrorBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { compressImageFiles } from "@/lib/compressImage";
import { errorMessage } from "@/lib/errors";

type Product = {
  id: number;
  name: string;
  base_price: string;
  sale_price?: string | null;
  has_discount?: boolean;
  effective_price?: string;
  category_name?: string;
  image_url?: string | null;
};

export default function BusinessProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

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

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setFiles(await compressImageFiles(Array.from(list)));
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = new FormData();
      data.set("name", name);
      data.set("base_price", basePrice);
      data.set("category_id", categoryId);
      data.set("description", description);
      if (files[0]) data.set("image", files[0]);
      files.slice(1).forEach((file) => data.append("images", file));
      await api("/api/business/products", {
        method: "POST",
        auth: true,
        body: data,
      });
      setName("");
      setBasePrice("");
      setDescription("");
      setFiles([]);
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Listings" subtitle="Products customers can order — add photos from gallery or camera" />
      {error ? <ErrorBox message={error} /> : null}
      <form onSubmit={createProduct} className="mb-6 grid gap-3 rounded-2xl bg-white p-5 shadow-card md:grid-cols-2">
        <input
          className="rounded-xl border border-line px-3 py-2"
          placeholder="Listing name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="rounded-xl border border-line px-3 py-2"
          placeholder="Price"
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
        <input
          className="rounded-xl border border-line px-3 py-2"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => void onFiles(e.target.files)}
        />
        <textarea
          className="rounded-xl border border-line px-3 py-2 md:col-span-2"
          placeholder="Short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        {files.length ? (
          <p className="text-sm text-muted md:col-span-2">
            {files.length} photo{files.length === 1 ? "" : "s"} ready (compressed)
          </p>
        ) : null}
        <button
          className="rounded-xl bg-deal px-4 py-2 font-semibold text-white md:col-span-2"
          type="submit"
          disabled={saving}
        >
          {saving ? "Saving…" : "Add listing"}
        </button>
      </form>
      {products.length === 0 ? (
        <Empty title="No listings yet" />
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-card">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <div className="grid h-14 w-14 place-items-center rounded-lg bg-paper text-sm font-bold text-deal">
                  {p.name.slice(0, 1)}
                </div>
              )}
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-muted">
                  {p.category_name} ·{" "}
                  {p.has_discount ? `${p.effective_price} (was ${p.base_price})` : p.base_price}
                </div>
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
