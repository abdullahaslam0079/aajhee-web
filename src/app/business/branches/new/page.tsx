"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { AddressSearch } from "@/components/AddressSearch";
import { Button, ErrorBox, Field, PageHeader, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { AddressSuggestion } from "@/lib/geocode";

const LocationMapPicker = dynamic(
  () => import("@/components/LocationMapPicker").then((m) => m.LocationMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-xl border border-line text-sm text-muted">
        Loading map…
      </div>
    ),
  },
);

export default function NewBranchPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    street: "",
    house_number: "",
    postal_code: "",
    city: "Lahore",
    latitude: "31.520400",
    longitude: "74.358700",
  });

  function applyLocation(hit: AddressSuggestion) {
    setForm((current) => ({
      ...current,
      street: hit.street || current.street,
      house_number: hit.houseNumber || current.house_number,
      postal_code: hit.postalCode || current.postal_code,
      city: hit.city || current.city,
      latitude: hit.latitude,
      longitude: hit.longitude,
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await api<{ id: number }>("/api/business/branches", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          ...form,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        }),
      });
      router.push(`/business/branches/${created.id}`);
    } catch (err) {
      setError(errorMessage(err, "Could not create branch."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Add branch"
        subtitle="Search an address or drop a pin so customers can find you on the map"
        actions={
          <Link href="/business/branches" className="text-sm font-semibold text-muted hover:text-ink">
            ← All branches
          </Link>
        }
      />
      <form onSubmit={submit} className="card mx-auto max-w-xl space-y-3 p-5">
        {error ? <ErrorBox message={error} /> : null}
        <Field label="Name">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </Field>
        <Field label="Search address">
          <AddressSearch onPick={applyLocation} />
        </Field>
        <Field label="Map location">
          <LocationMapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onPick={applyLocation}
          />
        </Field>
        <Field label="Street">
          <input
            className={inputClass}
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            required
          />
        </Field>
        <Field label="House number">
          <input
            className={inputClass}
            value={form.house_number}
            onChange={(e) => setForm({ ...form, house_number: e.target.value })}
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Postal code">
            <input
              className={inputClass}
              value={form.postal_code}
              onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
              required
            />
          </Field>
          <Field label="City">
            <input
              className={inputClass}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude">
            <input className={inputClass} value={form.latitude} readOnly />
          </Field>
          <Field label="Longitude">
            <input className={inputClass} value={form.longitude} readOnly />
          </Field>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Create branch"}
        </Button>
      </form>
    </div>
  );
}
