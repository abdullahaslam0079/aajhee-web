"use client";

import { useEffect, useState } from "react";
import { Button, ErrorBox, Field, PageHeader, Skeleton, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import { compressImageFiles } from "@/lib/compressImage";
import { errorMessage } from "@/lib/errors";
import type { BusinessProfile, Category } from "@/lib/types";

export default function BusinessSettingsPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [presenceMode, setPresenceMode] = useState("hybrid");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<BusinessProfile>("/api/business/profile", { auth: true }),
      api<Category[]>("/api/categories").catch(() => []),
      api<{ presence_mode?: string } | null>("/api/business/presence", { auth: true }).catch(
        () => null,
      ),
    ])
      .then(([p, cats, presence]) => {
        setProfile(p);
        setName(p.name || "");
        const catId =
          p.category_id != null
            ? String(p.category_id)
            : typeof p.category === "object" && p.category
              ? String(p.category.id)
              : p.category
                ? String(p.category)
                : "";
        setCategoryId(catId);
        setCategories(Array.isArray(cats) ? cats : []);
        if (p.presence_mode) setPresenceMode(p.presence_mode);
        else if (presence?.presence_mode) setPresenceMode(presence.presence_mode);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const data = new FormData();
      data.set("name", name);
      if (categoryId) data.set("category_id", categoryId);
      data.set("presence_mode", presenceMode);
      if (logoFile) data.set("logo", logoFile);
      const updated = await api<BusinessProfile>("/api/business/profile", {
        method: "PUT",
        auth: true,
        body: data,
      });
      setProfile(updated);
      setLogoFile(null);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err, "Could not save settings."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Business profile, logo, and presence" />
      <form onSubmit={save} className="card mx-auto max-w-xl space-y-4 p-5">
        {error ? <ErrorBox message={error} /> : null}
        {saved ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Settings saved.</p>
        ) : null}
        {profile?.logo_url || profile?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.logo_url || profile.logo || ""}
            alt=""
            className="h-20 w-20 rounded-2xl object-cover"
          />
        ) : null}
        <Field label="Business name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        {profile?.email ? (
          <Field label="Login email">
            <input className={inputClass} value={profile.email} disabled />
          </Field>
        ) : null}
        <Field label="Category">
          <select
            className={inputClass}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Presence">
          <select
            className={inputClass}
            value={presenceMode}
            onChange={(e) => setPresenceMode(e.target.value)}
          >
            <option value="hybrid">Hybrid (online + in-store)</option>
            <option value="online_only">Online only</option>
            <option value="instore_only">In-store only</option>
          </select>
        </Field>
        <Field label="Logo">
          <input
            className={inputClass}
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const list = e.target.files;
              if (!list?.length) return;
              const compressed = await compressImageFiles(Array.from(list));
              setLogoFile(compressed[0] || null);
            }}
          />
        </Field>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  );
}
