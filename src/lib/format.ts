import type { Offer } from "./types";

export function money(value?: number | string | null) {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return null;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export function percent(value?: number | string | null) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!n) return null;
  return `${Math.round(n)}%`;
}

export function offerImage(offer?: Offer | null) {
  return offer?.image_urls?.[0] || offer?.business_logo_url || "";
}

export function km(value?: number | null) {
  if (value == null) return "";
  return `${value.toFixed(1)} km`;
}

export function displayName(user: { first_name?: string; last_name?: string; name?: string; email?: string } | null) {
  if (!user) return "Goluto";
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return user.name || full || user.email || "Goluto";
}

export function channelOf(offer: Offer): "online" | "inStore" {
  return offer.is_online ? "online" : "inStore";
}

export function savings(original?: number | string | null, discounted?: number | string | null) {
  const from = typeof original === "string" ? Number(original) : original;
  const to = typeof discounted === "string" ? Number(discounted) : discounted;
  if (from == null || to == null || Number.isNaN(from) || Number.isNaN(to) || from <= to) return null;
  return money(from - to);
}
