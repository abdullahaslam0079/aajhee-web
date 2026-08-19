"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Empty, ErrorBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { percent } from "@/lib/format";
import type { BusinessOffer } from "@/lib/types";

export default function BusinessOffersPage() {
  const [offers, setOffers] = useState<BusinessOffer[]>([]);
  const [error, setError] = useState("");

  function load() {
    return api<BusinessOffer[]>("/api/business/offers", { auth: true })
      .then((data) => setOffers(Array.isArray(data) ? data : []))
      .catch((err) => setError(errorMessage(err)));
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: number) {
    if (!confirm("Delete this offer?")) return;
    try {
      await api(`/api/business/offers/${id}`, { method: "DELETE", auth: true });
      load();
    } catch (err) {
      setError(errorMessage(err, "Could not delete offer."));
    }
  }

  return (
    <div>
      <PageHeader title="Offers" action={{ href: "/business/offers/new", label: "New offer" }} />
      {error ? <ErrorBox message={error} /> : null}
      {offers.length === 0 && !error ? (
        <Empty title="No offers" body="Create an in-store or online deal for your branches." />
      ) : (
        <div className="grid gap-3">
          {offers.map((offer) => (
            <article key={offer.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-card outline outline-1 outline-black/5">
              <div>
                <p className="font-bold">{offer.title}</p>
                <p className="text-sm text-muted">
                  {offer.is_online ? "Online" : "In-store"}
                  {percent(offer.discount_percent) ? ` · ${percent(offer.discount_percent)} off` : ""}
                  {offer.is_enabled === false ? " · paused" : ""}
                </p>
              </div>
              <div className="flex gap-3 text-sm font-semibold">
                <Link href={`/business/offers/${offer.id}`}>Open</Link>
                <button type="button" className="text-red-600" onClick={() => remove(offer.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
