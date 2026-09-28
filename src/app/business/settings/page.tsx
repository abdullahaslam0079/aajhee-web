"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Button,
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
import type { BusinessProfile, Category } from "@/lib/types";

type PresencePayload = {
  presence_mode?: string;
  online_coverage?: string;
  primary_city_id?: number | null;
  primary_country_id?: number | null;
  category_ids?: number[];
};

type Country = { id: number; code: string; name: string };
type City = { id: number; name: string; country?: Country };

const DAY_KEYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
] as const;

type DayHours = { open: string; close: string; closed: boolean };

function defaultHours(): Record<string, DayHours> {
  return Object.fromEntries(
    DAY_KEYS.map(({ key }) => [key, { open: "10:00", close: "22:00", closed: false }]),
  );
}

function verificationLabel(status?: string) {
  if (status === "verified") return "Verified";
  if (status === "suspended") return "Suspended";
  if (status === "under_review") return "Under review";
  return status || "Under review";
}

export default function BusinessSettingsPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [notificationWhatsapp, setNotificationWhatsapp] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [hours, setHours] = useState<Record<string, DayHours>>(defaultHours());
  const [categoryId, setCategoryId] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [presenceMode, setPresenceMode] = useState("hybrid");
  const [onlineCoverage, setOnlineCoverage] = useState("city");
  const [countryId, setCountryId] = useState("");
  const [cityId, setCityId] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<BusinessProfile>("/api/business/profile", { auth: true }),
      api<Category[]>("/api/categories").catch(() => []),
      api<PresencePayload | null>("/api/business/presence", { auth: true }).catch(() => null),
      api<Country[]>("/api/countries").catch(() => []),
    ])
      .then(([p, cats, presence, countryList]) => {
        setProfile(p);
        setName(p.name || "");
        setPhone(p.phone || "");
        setInstagramUrl(p.instagram_url || "");
        setNotificationWhatsapp(p.notification_whatsapp || "");
        setIsPaused(Boolean(p.is_paused));
        setHours({ ...defaultHours(), ...(p.business_hours || {}) } as Record<string, DayHours>);
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
        setCountries(Array.isArray(countryList) ? countryList : []);
        setPresenceMode(presence?.presence_mode || p.presence_mode || "hybrid");
        setOnlineCoverage(presence?.online_coverage || p.online_coverage || "city");
        if (presence?.primary_country_id) setCountryId(String(presence.primary_country_id));
        if (presence?.primary_city_id) setCityId(String(presence.primary_city_id));
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!countryId && !cityQuery) {
      setCities([]);
      return;
    }
    const handle = window.setTimeout(() => {
      api<City[]>("/api/cities", {
        query: {
          country_id: countryId || undefined,
          q: cityQuery || undefined,
        },
      })
        .then((data) => setCities(Array.isArray(data) ? data : []))
        .catch(() => setCities([]));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [countryId, cityQuery]);

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
      data.set("phone", phone);
      data.set("instagram_url", instagramUrl);
      data.set("notification_whatsapp", notificationWhatsapp);
      data.set("is_paused", String(isPaused));
      data.set("business_hours", JSON.stringify(hours));
      if (logoFile) data.set("logo", logoFile);
      const updated = await api<BusinessProfile>("/api/business/profile", {
        method: "PUT",
        auth: true,
        body: data,
      });
      await api("/api/business/presence", {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({
          presence_mode: presenceMode,
          online_coverage: onlineCoverage,
          primary_country_id: countryId ? Number(countryId) : null,
          primary_city_id: cityId ? Number(cityId) : null,
          category_ids: categoryId ? [Number(categoryId)] : [],
        }),
      });
      setProfile({
        ...updated,
        presence_mode: presenceMode,
        online_coverage: onlineCoverage,
        phone,
        instagram_url: instagramUrl,
        notification_whatsapp: notificationWhatsapp,
        is_paused: isPaused,
        business_hours: hours,
      });
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

  const showCoverage = presenceMode !== "instore_only";

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Business profile, hours, pause shop, and alerts"
        actions={
          <Badge
            tone={
              profile?.verification_status === "verified"
                ? "success"
                : profile?.verification_status === "suspended"
                  ? "danger"
                  : "warning"
            }
          >
            {verificationLabel(profile?.verification_status)}
          </Badge>
        }
      />
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
        <Field label="Phone number">
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Instagram link">
          <input
            className={inputClass}
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/yourshop"
          />
        </Field>
        <Field
          label="WhatsApp / notification number"
          hint="Used for order alerts. WhatsApp/SMS sending needs a provider — see backend TODO."
        >
          <input
            className={inputClass}
            value={notificationWhatsapp}
            onChange={(e) => setNotificationWhatsapp(e.target.value)}
            placeholder="03XXXXXXXXX"
          />
        </Field>
        <div className="space-y-1">
          <Toggle checked={isPaused} onChange={setIsPaused} label="Pause shop" />
          <p className="text-xs text-muted">
            Hide your store from customers without deleting listings or branches.
          </p>
        </div>
        <Field label="Main category">
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
        <div className="space-y-3 rounded-xl bg-paper/70 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Business hours</h3>
          {DAY_KEYS.map(({ key, label }) => {
            const day = hours[key] || { open: "10:00", close: "22:00", closed: false };
            return (
              <div key={key} className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                <p className="text-sm font-semibold">{label}</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(day.closed)}
                    onChange={(e) =>
                      setHours({
                        ...hours,
                        [key]: { ...day, closed: e.target.checked },
                      })
                    }
                  />
                  Closed
                </label>
                <input
                  className={inputClass}
                  type="time"
                  disabled={day.closed}
                  value={day.open}
                  onChange={(e) =>
                    setHours({ ...hours, [key]: { ...day, open: e.target.value } })
                  }
                />
                <input
                  className={inputClass}
                  type="time"
                  disabled={day.closed}
                  value={day.close}
                  onChange={(e) =>
                    setHours({ ...hours, [key]: { ...day, close: e.target.value } })
                  }
                />
              </div>
            );
          })}
        </div>
        <Field label="Presence" hint="Controls whether customers find you online, in-store, or both.">
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
        {showCoverage ? (
          <>
            <Field label="Online coverage" hint="City limits discovery to your primary city; country shows you nationwide.">
              <select
                className={inputClass}
                value={onlineCoverage}
                onChange={(e) => setOnlineCoverage(e.target.value)}
              >
                <option value="city">Primary city</option>
                <option value="country">Whole country</option>
              </select>
            </Field>
            <Field label="Primary country">
              <select
                className={inputClass}
                value={countryId}
                onChange={(e) => {
                  setCountryId(e.target.value);
                  setCityId("");
                }}
              >
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            {onlineCoverage === "city" ? (
              <>
                <Field label="Search city">
                  <input
                    className={inputClass}
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                    placeholder="Type a city name"
                  />
                </Field>
                <Field label="Primary city">
                  <select
                    className={inputClass}
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                  >
                    <option value="">Select city</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.country?.name ? ` · ${c.country.name}` : ""}
                      </option>
                    ))}
                    {cityId && !cities.some((c) => String(c.id) === cityId) ? (
                      <option value={cityId}>Current city #{cityId}</option>
                    ) : null}
                  </select>
                </Field>
              </>
            ) : null}
          </>
        ) : null}
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
        <p className="text-sm text-muted">
          Same-day delivery fees, delivery areas, and payment accounts (bank, JazzCash, Easypaisa)
          are configured per branch under Branches.
        </p>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  );
}
