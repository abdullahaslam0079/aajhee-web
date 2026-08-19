"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ErrorBox } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { money, percent } from "@/lib/format";
import type { BusinessOffer } from "@/lib/types";

export default function BusinessOfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [offer, setOffer] = useState<BusinessOffer | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<BusinessOffer>(`/api/business/offers/${id}`, { auth: true })
      .then(setOffer)
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  if (error) return <ErrorBox message={error} />;
  if (!offer) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="mx-auto max-w-xl rounded-2xl bg-white p-5 shadow-card outline outline-1 outline-black/5">
      <p className="text-sm font-semibold text-muted">{offer.is_online ? "Online" : "In-store"}</p>
      <h1 className="font-display text-2xl font-semibold tracking-tight">{offer.title}</h1>
      <p className="mt-2 text-deal font-extrabold">
        {money(offer.discounted_price) || percent(offer.discount_percent) || "Deal"}
      </p>
      {offer.description ? <p className="mt-3 text-sm text-muted">{offer.description}</p> : null}
      {offer.qr_code ? (
        <p className="mt-4 rounded-2xl bg-paper p-3 text-xs">
          Poster QR: <code>{offer.qr_code}</code>
        </p>
      ) : null}
      {offer.branch_stats?.length ? (
        <div className="mt-4">
          <h2 className="font-bold">Branch activity</h2>
          {offer.branch_stats.map((stat) => (
            <p key={stat.branch_id} className="mt-1 text-sm text-muted">
              {stat.branch_name}: {stat.scan_count} scans · {stat.avail_count} uses
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
