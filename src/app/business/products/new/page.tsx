"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorBox, Field, PageHeader, Toggle, inputClass } from "@/components/ui";
import { CategoryTreePicker } from "@/components/CategoryTreePicker";
import { api } from "@/lib/api";
import { compressImageFiles } from "@/lib/compressImage";
import { errorMessage } from "@/lib/errors";
import type { Branch, CategoryTreeNode } from "@/lib/types";

export default function NewProductPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [files, setFiles] = useState<File[]>([]);
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

  useEffect(() => {
    api<CategoryTreeNode[]>("/api/categories/tree")
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCategories(list);
        const firstLeaf =
          list.flatMap((r) => (r.children?.length ? r.children : [r]))[0] || list[0];
        if (firstLeaf) setForm((f) => ({ ...f, category_id: String(firstLeaf.id) }));
      })
      .catch(() => undefined);
    api<Branch[]>("/api/business/branches", { auth: true })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setBranches(list);
        setForm((f) => ({ ...f, branch_ids: list.map((b) => b.id) }));
      })
      .catch(() => undefined);
  }, []);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setFiles(await compressImageFiles(Array.from(list)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let created: { id: number };
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
        form.branch_ids.forEach((id) => data.append("branch_ids", String(id)));
        data.set("image", files[0]);
        files.slice(1).forEach((file) => data.append("images", file));
        created = await api<{ id: number }>("/api/business/products", {
          method: "POST",
          auth: true,
          body: data,
        });
      } else {
        created = await api<{ id: number }>("/api/business/products", {
          method: "POST",
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
      router.push(`/business/products/${created.id}`);
    } catch (err) {
      setError(errorMessage(err, "Could not create listing."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Add listing" subtitle="Name, price, photos, and which branches sell it" />
      <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-4 p-5">
        {error ? <ErrorBox message={error} /> : null}
        <Field label="Listing name">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Price (Rs)">
            <input
              className={inputClass}
              value={form.base_price}
              onChange={(e) => setForm({ ...form, base_price: e.target.value })}
              required
            />
          </Field>
          <Field label="Stock (optional)">
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
          <CategoryTreePicker
            tree={categories}
            value={form.category_id}
            preferLeaves
            required
            placeholder="Select category"
            onChange={(v) => setForm({ ...form, category_id: v })}
          />
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
            rows={4}
            value={form.detailed_description}
            onChange={(e) => setForm({ ...form, detailed_description: e.target.value })}
          />
        </Field>
        <Field label="Photos" hint="First photo becomes the cover">
          <input
            className={inputClass}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(e) => void onFiles(e.target.files)}
          />
        </Field>
        {files.length ? (
          <p className="text-sm text-muted">
            {files.length} photo{files.length === 1 ? "" : "s"} ready
          </p>
        ) : null}
        {branches.length ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink/80">Available at branches</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {branches.map((branch) => {
                const checked = form.branch_ids.includes(branch.id);
                return (
                  <label key={branch.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          branch_ids: e.target.checked
                            ? [...form.branch_ids, branch.id]
                            : form.branch_ids.filter((id) => id !== branch.id),
                        });
                      }}
                    />
                    {branch.name}
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-4">
          <Toggle
            checked={form.is_enabled}
            onChange={(v) => setForm({ ...form, is_enabled: v })}
            label="Enabled (visible in catalog)"
          />
          <Toggle
            checked={form.is_available}
            onChange={(v) => setForm({ ...form, is_available: v })}
            label="Available to order"
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Create listing"}
        </Button>
      </form>
    </div>
  );
}
