"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorBox, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { Branch } from "@/lib/types";

export default function NewOfferPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    offer_type: "percentage_bill",
    redemption_mode: "view_only",
    is_online: false,
    discount_percent: "10",
    item_name: "",
    original_price: "",
    discounted_price: "",
    included_items: "",
    external_url: "",
    usage_limit_type: "one_time",
    usage_limit_count: "1",
    branch_ids: [] as number[],
  });

  useEffect(() => {
    api<Branch[]>("/api/business/branches", { auth: true })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setBranches(list);
        setForm((current) => ({ ...current, branch_ids: list.map((b) => b.id) }));
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      offer_type: form.offer_type,
      redemption_mode: form.is_online ? "view_only" : form.redemption_mode,
      is_online: form.is_online,
      usage_limit_type: form.usage_limit_type,
      usage_limit_count: Number(form.usage_limit_count),
      branch_ids: form.is_online ? [] : form.branch_ids,
      is_enabled: true,
    };
    if (form.offer_type === "percentage_bill") payload.discount_percent = form.discount_percent;
    if (form.offer_type === "item") {
      payload.item_name = form.item_name;
      payload.original_price = form.original_price;
      payload.discounted_price = form.discounted_price;
    }
    if (form.offer_type === "deal") {
      payload.included_items = form.included_items.split(",").map((s) => s.trim()).filter(Boolean);
      payload.discounted_price = form.discounted_price;
    }
    if (form.is_online && form.external_url) payload.external_url = form.external_url;

    try {
      await api("/api/business/offers", {
        method: "POST",
        auth: true,
        body: JSON.stringify(payload),
      });
      router.push("/business/offers");
    } catch (err) {
      setError(errorMessage(err, "Could not create offer."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-3 rounded-2xl bg-white p-5 shadow-card outline outline-1 outline-black/5">
      <h1 className="text-2xl font-extrabold tracking-tight">New offer</h1>
      {error ? <ErrorBox message={error} /> : null}
      <Field label="Title">
        <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      </Field>
      <Field label="Description">
        <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
      <Field label="Type">
        <select className={inputClass} value={form.offer_type} onChange={(e) => setForm({ ...form, offer_type: e.target.value })}>
          <option value="percentage_bill">Percentage off bill</option>
          <option value="item">Item discount</option>
          <option value="deal">Deal / bundle</option>
        </select>
      </Field>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={form.is_online}
          onChange={(e) => setForm({ ...form, is_online: e.target.checked, redemption_mode: e.target.checked ? "view_only" : "scannable" })}
        />
        Online offer (no in-store scan)
      </label>
      {form.offer_type === "percentage_bill" ? (
        <Field label="Discount %">
          <input className={inputClass} value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} />
        </Field>
      ) : null}
      {form.offer_type === "item" ? (
        <>
          <Field label="Item name">
            <input className={inputClass} value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Original price">
              <input className={inputClass} value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} />
            </Field>
            <Field label="Discounted price">
              <input className={inputClass} value={form.discounted_price} onChange={(e) => setForm({ ...form, discounted_price: e.target.value })} />
            </Field>
          </div>
        </>
      ) : null}
      {form.offer_type === "deal" ? (
        <>
          <Field label="Included items (comma separated)">
            <input className={inputClass} value={form.included_items} onChange={(e) => setForm({ ...form, included_items: e.target.value })} />
          </Field>
          <Field label="Deal price">
            <input className={inputClass} value={form.discounted_price} onChange={(e) => setForm({ ...form, discounted_price: e.target.value })} />
          </Field>
        </>
      ) : null}
      {form.is_online ? (
        <Field label="Shop URL">
          <input className={inputClass} value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} />
        </Field>
      ) : (
        <Field label="Branches">
          <div className="space-y-2 rounded-xl border border-line p-3">
            {branches.map((branch) => (
              <label key={branch.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.branch_ids.includes(branch.id)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...form.branch_ids, branch.id]
                      : form.branch_ids.filter((id) => id !== branch.id);
                    setForm({ ...form, branch_ids: next });
                  }}
                />
                {branch.name}
              </label>
            ))}
          </div>
        </Field>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Create offer"}
      </Button>
    </form>
  );
}
