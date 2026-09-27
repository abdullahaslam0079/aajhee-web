"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { BranchContact, BranchFulfillmentSettings } from "@/lib/types";
import { Button, ErrorBox, Field, Skeleton, Toggle, inputClass } from "./ui";

const CONTACT_TYPES = [
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
] as const;

const emptyContact = (): BranchContact => ({
  contact_type: "phone",
  value: "",
  is_primary: true,
});

const defaultFulfillment = (): BranchFulfillmentSettings => ({
  pickup_enabled: true,
  pickup_radius_km: "15.00",
  local_same_day_enabled: true,
  local_delivery_fee: "0.00",
  local_max_delivery_hours: 24,
  nationwide_enabled: false,
  nationwide_delivery_fee: "0.00",
  nationwide_max_delivery_hours: 72,
  customer_cancel_policy: "window_minutes",
  customer_cancel_window_minutes: 30,
  bank_transfer_enabled: false,
  bank_transfer_instructions: "",
  stripe_enabled: false,
  stripe_instructions: "",
  jazzcash_enabled: false,
  jazzcash_instructions: "",
  cash_on_pickup_enabled: true,
  cash_on_delivery_enabled: true,
});

export function BranchCommercePanel({ branchId }: { branchId: number }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [contacts, setContacts] = useState<BranchContact[]>([emptyContact()]);
  const [fulfillment, setFulfillment] = useState<BranchFulfillmentSettings>(defaultFulfillment());

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<BranchContact[]>(`/api/business/branches/${branchId}/contacts`, { auth: true }),
      api<BranchFulfillmentSettings>(`/api/business/branches/${branchId}/fulfillment`, { auth: true }),
    ])
      .then(([contactData, fulfillmentData]) => {
        if (cancelled) return;
        setContacts(Array.isArray(contactData) && contactData.length ? contactData : [emptyContact()]);
        setFulfillment({ ...defaultFulfillment(), ...(fulfillmentData || {}) });
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Could not load delivery settings"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branchId]);

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const cleaned = contacts
        .map((c) => ({
          contact_type: c.contact_type,
          value: c.value.trim(),
          is_primary: Boolean(c.is_primary),
        }))
        .filter((c) => c.value);
      if (!cleaned.length) {
        setError("Add at least one contact before saving.");
        setSaving(false);
        return;
      }
      await api(`/api/business/branches/${branchId}/contacts`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify(cleaned),
      });
      await api(`/api/business/branches/${branchId}/fulfillment`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({
          ...fulfillment,
          pickup_radius_km: String(fulfillment.pickup_radius_km),
          local_delivery_fee: String(fulfillment.local_delivery_fee),
          nationwide_delivery_fee: String(fulfillment.nationwide_delivery_fee),
        }),
      });
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err, "Could not save delivery settings"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Skeleton className="mt-6 h-64 w-full" />;

  return (
    <div className="card mt-6 space-y-5 p-5">
      <div>
        <h2 className="text-lg font-semibold">Contacts & delivery</h2>
        <p className="text-sm text-muted">
          How customers reach you, fulfillment options, payments, and cancel policy.
        </p>
      </div>
      {error ? <ErrorBox message={error} /> : null}
      {saved ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Settings saved.</p>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Contacts</h3>
        {contacts.map((contact, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[140px_1fr_auto_auto]">
            <select
              className={inputClass}
              value={contact.contact_type}
              onChange={(e) => {
                const next = [...contacts];
                next[index] = {
                  ...contact,
                  contact_type: e.target.value as BranchContact["contact_type"],
                };
                setContacts(next);
              }}
            >
              {CONTACT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              value={contact.value}
              placeholder="Phone, WhatsApp, or email"
              onChange={(e) => {
                const next = [...contacts];
                next[index] = { ...contact, value: e.target.value };
                setContacts(next);
              }}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(contact.is_primary)}
                onChange={(e) => {
                  setContacts(
                    contacts.map((c, i) => ({
                      ...c,
                      is_primary: i === index ? e.target.checked : false,
                    })),
                  );
                }}
              />
              Primary
            </label>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setContacts(contacts.filter((_, i) => i !== index))}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={() => setContacts([...contacts, emptyContact()])}>
          Add contact
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded-xl bg-paper/70 p-4">
          <Toggle
            checked={fulfillment.pickup_enabled}
            onChange={(v) => setFulfillment({ ...fulfillment, pickup_enabled: v })}
            label="Pickup"
          />
          <Field label="Pickup radius (km)">
            <input
              className={inputClass}
              value={fulfillment.pickup_radius_km}
              onChange={(e) => setFulfillment({ ...fulfillment, pickup_radius_km: e.target.value })}
            />
          </Field>
          <Toggle
            checked={fulfillment.cash_on_pickup_enabled}
            onChange={(v) => setFulfillment({ ...fulfillment, cash_on_pickup_enabled: v })}
            label="Cash on pickup"
          />
        </div>

        <div className="space-y-3 rounded-xl bg-paper/70 p-4">
          <Toggle
            checked={fulfillment.local_same_day_enabled}
            onChange={(v) => setFulfillment({ ...fulfillment, local_same_day_enabled: v })}
            label="Local same-day delivery"
          />
          <Field label="Local delivery fee">
            <input
              className={inputClass}
              value={fulfillment.local_delivery_fee}
              onChange={(e) => setFulfillment({ ...fulfillment, local_delivery_fee: e.target.value })}
            />
          </Field>
          <Field label="Max hours">
            <input
              className={inputClass}
              type="number"
              value={fulfillment.local_max_delivery_hours}
              onChange={(e) =>
                setFulfillment({ ...fulfillment, local_max_delivery_hours: Number(e.target.value) })
              }
            />
          </Field>
          <Toggle
            checked={fulfillment.cash_on_delivery_enabled}
            onChange={(v) => setFulfillment({ ...fulfillment, cash_on_delivery_enabled: v })}
            label="Cash on delivery"
          />
        </div>

        <div className="space-y-3 rounded-xl bg-paper/70 p-4 sm:col-span-2">
          <Toggle
            checked={fulfillment.nationwide_enabled}
            onChange={(v) => setFulfillment({ ...fulfillment, nationwide_enabled: v })}
            label="Nationwide delivery"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nationwide fee">
              <input
                className={inputClass}
                value={fulfillment.nationwide_delivery_fee}
                onChange={(e) =>
                  setFulfillment({ ...fulfillment, nationwide_delivery_fee: e.target.value })
                }
              />
            </Field>
            <Field label="Max hours">
              <input
                className={inputClass}
                type="number"
                value={fulfillment.nationwide_max_delivery_hours}
                onChange={(e) =>
                  setFulfillment({
                    ...fulfillment,
                    nationwide_max_delivery_hours: Number(e.target.value),
                  })
                }
              />
            </Field>
          </div>
        </div>

        <div className="space-y-3 rounded-xl bg-paper/70 p-4 sm:col-span-2">
          <Toggle
            checked={fulfillment.bank_transfer_enabled}
            onChange={(v) => setFulfillment({ ...fulfillment, bank_transfer_enabled: v })}
            label="Bank transfer"
          />
          <Field label="Bank transfer instructions" hint="Account title, number, and bank name">
            <textarea
              className={inputClass}
              rows={3}
              value={fulfillment.bank_transfer_instructions}
              onChange={(e) =>
                setFulfillment({ ...fulfillment, bank_transfer_instructions: e.target.value })
              }
            />
          </Field>
          <Toggle
            checked={fulfillment.stripe_enabled}
            onChange={(v) => setFulfillment({ ...fulfillment, stripe_enabled: v })}
            label="Card (Stripe) — customer uploads payment screenshot"
          />
          <Field label="Card payment instructions" hint="Payment link, account details, or how to pay">
            <textarea
              className={inputClass}
              rows={3}
              value={fulfillment.stripe_instructions}
              onChange={(e) =>
                setFulfillment({ ...fulfillment, stripe_instructions: e.target.value })
              }
            />
          </Field>
          <Toggle
            checked={fulfillment.jazzcash_enabled}
            onChange={(v) => setFulfillment({ ...fulfillment, jazzcash_enabled: v })}
            label="JazzCash — customer uploads payment screenshot"
          />
          <Field label="JazzCash instructions" hint="JazzCash number / account name">
            <textarea
              className={inputClass}
              rows={3}
              value={fulfillment.jazzcash_instructions}
              onChange={(e) =>
                setFulfillment({ ...fulfillment, jazzcash_instructions: e.target.value })
              }
            />
          </Field>
          <Field
            label="Customer cancel policy"
            hint="Customers can only cancel while the order is still pending. After you accept, cancel is merchant-only."
          >
            <select
              className={inputClass}
              value={fulfillment.customer_cancel_policy}
              onChange={(e) =>
                setFulfillment({
                  ...fulfillment,
                  customer_cancel_policy: e.target.value as BranchFulfillmentSettings["customer_cancel_policy"],
                })
              }
            >
              <option value="window_minutes">Allow while pending (time window)</option>
              <option value="disabled">Do not allow customer cancel</option>
            </select>
          </Field>
          {fulfillment.customer_cancel_policy === "window_minutes" ? (
            <Field label="Cancel window (minutes)">
              <input
                className={inputClass}
                type="number"
                value={fulfillment.customer_cancel_window_minutes}
                onChange={(e) =>
                  setFulfillment({
                    ...fulfillment,
                    customer_cancel_window_minutes: Number(e.target.value),
                  })
                }
              />
            </Field>
          ) : null}
        </div>
      </div>

      <Button type="button" onClick={() => void save()} disabled={saving}>
        {saving ? "Saving…" : "Save contacts & delivery"}
      </Button>
    </div>
  );
}
