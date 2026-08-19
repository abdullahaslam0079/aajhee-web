"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Empty, ErrorBox, Field, inputClass } from "@/components/ui";
import { api, pageResults } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { setSavedLocation } from "@/lib/location";
import { useAuth } from "@/lib/useAuth";
import type { Address } from "@/lib/types";

export default function AddressesPage() {
  const { loggedIn } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "Berlin",
    county: "Berlin",
    latitude: "52.5200",
    longitude: "13.4050",
  });

  function load() {
    return api<Address[] | { results: Address[] }>("/api/user/addresses", { auth: true })
      .then((data) => setAddresses(pageResults(data as never) || (Array.isArray(data) ? data : [])))
      .catch((err) => setError(errorMessage(err)));
  }

  useEffect(() => {
    if (!loggedIn) {
      router.replace("/login");
      return;
    }
    load();
  }, [loggedIn, router]);

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/user/addresses", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          ...form,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          isDefault: addresses.length === 0,
        }),
      });
      setSavedLocation({
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        label: `${form.street} ${form.houseNumber}, ${form.city}`,
      });
      setForm({ ...form, street: "", houseNumber: "" });
      load();
    } catch (err) {
      setError(errorMessage(err, "Could not save address."));
    }
  }

  if (!loggedIn) return null;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 font-display text-2xl font-semibold tracking-tight">Addresses</h1>
      {error ? <ErrorBox message={error} /> : null}
      {addresses.length === 0 ? <Empty title="No saved addresses" body="Add a Berlin address to rank nearby deals." /> : null}
      <div className="mb-6 grid gap-3">
        {addresses.map((address) => (
          <button
            key={String(address.id)}
            type="button"
            className="rounded-2xl bg-white p-4 text-left shadow-card outline outline-1 outline-black/5 transition hover:shadow-lift"
            onClick={() =>
              setSavedLocation({
                latitude: Number(address.latitude),
                longitude: Number(address.longitude),
                label: address.formattedAddress || `${address.street} ${address.houseNumber || address.house_number}`,
              })
            }
          >
            <p className="font-bold">
              {address.street} {address.houseNumber || address.house_number}
            </p>
            <p className="text-sm text-muted">
              {address.postalCode || address.postal_code} {address.city}
            </p>
          </button>
        ))}
      </div>

      <form onSubmit={addAddress} className="space-y-3 rounded-2xl bg-white p-5 shadow-card outline outline-1 outline-black/5">
        <h2 className="font-extrabold">Add address</h2>
        <Field label="Street">
          <input className={inputClass} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
        </Field>
        <Field label="House number">
          <input className={inputClass} value={form.houseNumber} onChange={(e) => setForm({ ...form, houseNumber: e.target.value })} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Postal code">
            <input className={inputClass} value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required />
          </Field>
          <Field label="City">
            <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          </Field>
        </div>
        <Button type="submit">Save address</Button>
      </form>
    </div>
  );
}
