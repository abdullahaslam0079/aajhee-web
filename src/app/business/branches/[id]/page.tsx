"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AddressSearch } from "@/components/AddressSearch";
import { BranchCommercePanel } from "@/components/BranchCommercePanel";
import {
  Button,
  ConfirmDialog,
  ErrorBox,
  Field,
  PageHeader,
  Skeleton,
  inputClass,
} from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { AddressSuggestion } from "@/lib/geocode";
import type { Branch } from "@/lib/types";

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

export default function EditBranchPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    name: "",
    street: "",
    house_number: "",
    postal_code: "",
    city: "",
    latitude: "31.520400",
    longitude: "74.358700",
  });

  useEffect(() => {
    api<Branch>(`/api/business/branches/${id}`, { auth: true })
      .then((branch) => {
        setForm({
          name: branch.name || "",
          street: branch.street || "",
          house_number: branch.house_number || "",
          postal_code: branch.postal_code || "",
          city: branch.city || "",
          latitude: String(branch.latitude ?? "31.520400"),
          longitude: String(branch.longitude ?? "74.358700"),
        });
        setLoaded(true);
      })
      .catch((err) => {
        setError(errorMessage(err));
        setLoaded(true);
      });
  }, [id]);

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
      await api(`/api/business/branches/${id}`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({
          ...form,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        }),
      });
    } catch (err) {
      setError(errorMessage(err, "Could not update branch."));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api(`/api/business/branches/${id}`, { method: "DELETE", auth: true });
      router.push("/business/branches");
    } catch (err) {
      setError(errorMessage(err));
      setConfirmDelete(false);
    }
  }

  if (!loaded) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit branch"
        subtitle="Address, map location, contacts, and delivery options"
        actions={
          <Link href="/business/branches" className="text-sm font-semibold text-muted hover:text-ink">
            ← All branches
          </Link>
        }
      />
      <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-3 p-5">
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
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save branch"}
          </Button>
          <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </div>
      </form>

      <div className="mx-auto max-w-2xl">
        <BranchCommercePanel key={id} branchId={id} />
      </div>

      {confirmDelete ? (
        <ConfirmDialog
          title="Delete branch?"
          message="This removes the branch permanently."
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
