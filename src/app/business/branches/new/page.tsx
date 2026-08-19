"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ErrorBox, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

export default function NewBranchPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    street: "",
    house_number: "",
    postal_code: "",
    city: "Berlin",
    latitude: "52.520000",
    longitude: "13.405000",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/api/business/branches", {
        method: "POST",
        auth: true,
        body: JSON.stringify(form),
      });
      router.push("/business/branches");
    } catch (err) {
      setError(errorMessage(err, "Could not create branch."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-3 rounded-2xl bg-white p-5 shadow-card outline outline-1 outline-black/5">
      <h1 className="text-2xl font-extrabold tracking-tight">Add branch</h1>
      {error ? <ErrorBox message={error} /> : null}
      <Field label="Name">
        <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </Field>
      <Field label="Street">
        <input className={inputClass} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
      </Field>
      <Field label="House number">
        <input className={inputClass} value={form.house_number} onChange={(e) => setForm({ ...form, house_number: e.target.value })} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Postal code">
          <input className={inputClass} value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} required />
        </Field>
        <Field label="City">
          <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitude">
          <input className={inputClass} value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
        </Field>
        <Field label="Longitude">
          <input className={inputClass} value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
        </Field>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Create branch"}
      </Button>
    </form>
  );
}
