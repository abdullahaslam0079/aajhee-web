"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Badge,
  Button,
  ConfirmDialog,
  ErrorBox,
  Field,
  PageHeader,
  Skeleton,
  Toggle,
  inputClass,
} from "@/components/ui";
import { api } from "@/lib/api";
import { compressImageFiles } from "@/lib/compressImage";
import { errorMessage } from "@/lib/errors";
import { rs } from "@/lib/format";
import type { Branch, Category, Product } from "@/lib/types";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [discountPercent, setDiscountPercent] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [form, setForm] = useState({
    name: "",
    base_price: "",
    category_id: "",
    description: "",
    detailed_description: "",
    stock_quantity: "",
    is_enabled: true,
    is_available: true,
    branch_ids: [] as number[],
  });

  function load() {
    api<Product>(`/api/business/products/${id}`, { auth: true })
      .then((p) => {
        setProduct(p);
        setForm({
          name: p.name || "",
          base_price: String(p.base_price ?? ""),
          category_id: String(p.category_id ?? ""),
          description: p.description || "",
          detailed_description: p.detailed_description || "",
          stock_quantity: p.stock_quantity != null ? String(p.stock_quantity) : "",
          is_enabled: p.is_enabled !== false,
          is_available: p.is_available !== false,
          branch_ids: p.branch_ids || [],
        });
        setDiscountPercent(p.discount_percent ? String(p.discount_percent) : "");
        setSalePrice(p.sale_price ? String(p.sale_price) : "");
      })
      .catch((err) => setError(errorMessage(err)));
  }

  useEffect(() => {
    load();
    api<Category[]>("/api/categories")
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => undefined);
    api<Branch[]>("/api/business/branches", { auth: true })
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setFiles(await compressImageFiles(Array.from(list)));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let updated: Product;
      if (files.length) {
        const data = new FormData();
        data.set("name", form.name);
        data.set("base_price", form.base_price);
        data.set("category_id", form.category_id);
        data.set("description", form.description);
        data.set("detailed_description", form.detailed_description);
        data.set("is_enabled", String(form.is_enabled));
        data.set("is_available", String(form.is_available));
        if (form.stock_quantity !== "") data.set("stock_quantity", form.stock_quantity);
        form.branch_ids.forEach((branchId) => data.append("branch_ids", String(branchId)));
        data.set("image", files[0]);
        files.slice(1).forEach((file) => data.append("images", file));
        updated = await api<Product>(`/api/business/products/${id}`, {
          method: "PATCH",
          auth: true,
          body: data,
        });
      } else {
        updated = await api<Product>(`/api/business/products/${id}`, {
          method: "PATCH",
          auth: true,
          body: JSON.stringify({
            name: form.name,
            base_price: form.base_price,
            category_id: Number(form.category_id),
            description: form.description,
            detailed_description: form.detailed_description,
            is_enabled: form.is_enabled,
            is_available: form.is_available,
            stock_quantity: form.stock_quantity === "" ? null : Number(form.stock_quantity),
            branch_ids: form.branch_ids,
          }),
        });
      }
      setProduct(updated);
      setFiles([]);
    } catch (err) {
      setError(errorMessage(err, "Could not save listing."));
    } finally {
      setSaving(false);
    }
  }

  async function applyDiscount(mode: "percent" | "sale" | "clear") {
    setSaving(true);
    setError("");
    try {
      const body =
        mode === "clear"
          ? { clear: true }
          : mode === "sale"
            ? { sale_price: salePrice }
            : { discount_percent: discountPercent };
      const updated = await api<Product>(`/api/business/products/${id}/discount`, {
        method: "POST",
        auth: true,
        body: JSON.stringify(body),
      });
      setProduct(updated);
      setDiscountPercent(updated.discount_percent ? String(updated.discount_percent) : "");
      setSalePrice(updated.sale_price ? String(updated.sale_price) : "");
    } catch (err) {
      setError(errorMessage(err, "Could not update discount."));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api(`/api/business/products/${id}`, { method: "DELETE", auth: true });
      router.push("/business/products");
    } catch (err) {
      setError(errorMessage(err));
      setConfirmDelete(false);
    }
  }

  if (!product && !error) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <PageHeader title="Listing" />
        <ErrorBox message={error || "Listing not found"} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={product.name}
        subtitle="Edit details, pricing, photos, and availability"
        actions={
          <Link href="/business/products" className="text-sm font-semibold text-muted hover:text-ink">
            ← All listings
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={product.is_enabled ? "success" : "neutral"}>
          {product.is_enabled ? "Live" : "Hidden"}
        </Badge>
        {product.has_discount ? (
          <Badge tone="deal">
            Sale {rs(product.effective_price)} (was {rs(product.base_price)})
          </Badge>
        ) : null}
        {product.view_count != null ? <Badge>{product.view_count} views</Badge> : null}
        {product.order_count != null ? <Badge>{product.order_count} orders</Badge> : null}
      </div>

      <form onSubmit={save} className="card mx-auto max-w-2xl space-y-4 p-5">
        {error ? <ErrorBox message={error} /> : null}
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt="" className="h-40 w-full rounded-xl object-cover" />
        ) : null}
        <Field label="Listing name">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Base price (Rs)">
            <input
              className={inputClass}
              value={form.base_price}
              onChange={(e) => setForm({ ...form, base_price: e.target.value })}
              required
            />
          </Field>
          <Field label="Stock">
            <input
              className={inputClass}
              type="number"
              min={0}
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
              placeholder="Unlimited"
            />
          </Field>
        </div>
        <Field label="Category">
          <select
            className={inputClass}
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Short description">
          <textarea
            className={inputClass}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Detailed description">
          <textarea
            className={inputClass}
            rows={5}
            value={form.detailed_description}
            onChange={(e) => setForm({ ...form, detailed_description: e.target.value })}
          />
        </Field>
        <Field label="Replace / add photos">
          <input
            className={inputClass}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(e) => void onFiles(e.target.files)}
          />
        </Field>
        {files.length ? <p className="text-sm text-muted">{files.length} new photo(s) ready</p> : null}
        {branches.length ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink/80">Available at branches</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {branches.map((branch) => (
                <label key={branch.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.branch_ids.includes(branch.id)}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        branch_ids: e.target.checked
                          ? [...form.branch_ids, branch.id]
                          : form.branch_ids.filter((x) => x !== branch.id),
                      });
                    }}
                  />
                  {branch.name}
                </label>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-4">
          <Toggle
            checked={form.is_enabled}
            onChange={(v) => setForm({ ...form, is_enabled: v })}
            label="Enabled"
          />
          <Toggle
            checked={form.is_available}
            onChange={(v) => setForm({ ...form, is_available: v })}
            label="Available to order"
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <div className="card mx-auto mt-4 max-w-2xl space-y-3 p-5">
        <h2 className="font-semibold">Discount</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Percent off">
            <input
              className={inputClass}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="e.g. 10"
            />
          </Field>
          <Field label="Or sale price (Rs)">
            <input
              className={inputClass}
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="e.g. 999"
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={saving} onClick={() => void applyDiscount("percent")}>
            Apply % off
          </Button>
          <Button type="button" variant="ghost" disabled={saving} onClick={() => void applyDiscount("sale")}>
            Apply sale price
          </Button>
          <Button type="button" variant="ghost" disabled={saving} onClick={() => void applyDiscount("clear")}>
            Clear discount
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-2xl">
        <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
          Delete listing
        </Button>
      </div>

      {confirmDelete ? (
        <ConfirmDialog
          title="Delete listing?"
          message="This removes the product from your catalog."
          confirmLabel="Delete"
          cancelLabel="Keep"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => void remove()}
        />
      ) : null}
    </div>
  );
}
