"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Empty, ErrorBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { Branch, BusinessOffer, BusinessProfile } from "@/lib/types";

export default function BusinessDashboardPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [offers, setOffers] = useState<BusinessOffer[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<BusinessProfile>("/api/business/profile", { auth: true }),
      api<Branch[]>("/api/business/branches", { auth: true }),
      api<BusinessOffer[]>("/api/business/offers", { auth: true }),
    ])
      .then(([p, b, o]) => {
        setProfile(p);
        setBranches(Array.isArray(b) ? b : []);
        setOffers(Array.isArray(o) ? o : []);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const stats = useMemo(() => {
    const active = offers.filter((offer) => offer.is_active && offer.is_enabled !== false).length;
    const scans = offers.reduce(
      (sum, offer) => sum + (offer.branch_stats || []).reduce((s, st) => s + (st.scan_count || 0), 0),
      0,
    );
    const avails = offers.reduce(
      (sum, offer) => sum + (offer.branch_stats || []).reduce((s, st) => s + (st.avail_count || 0), 0),
      0,
    );
    return { active, scans, avails };
  }, [offers]);

  return (
    <div>
      <PageHeader title={profile?.name || "Dashboard"} />
      {error ? <ErrorBox message={error} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Branches" value={branches.length} />
        <Stat label="Offers" value={offers.length} />
        <Stat label="Active offers" value={stats.active} />
        <Stat label="In-store uses" value={stats.avails} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl bg-white p-5 shadow-card outline outline-1 outline-black/5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-extrabold">Branches</h2>
            <Link href="/business/branches" className="text-sm font-semibold text-deal">
              Manage
            </Link>
          </div>
          {branches.length === 0 ? <Empty title="No branches yet" /> : null}
          {branches.slice(0, 4).map((branch) => (
            <p key={branch.id} className="border-t border-line py-2 text-sm">
              <span className="font-semibold">{branch.name}</span>
              <span className="text-muted"> · {branch.city}</span>
            </p>
          ))}
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-card outline outline-1 outline-black/5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-extrabold">Products</h2>
            <Link href="/business/products" className="text-sm font-semibold text-deal">
              Manage
            </Link>
          </div>
          <p className="text-sm text-muted">Create catalog items and discounts.</p>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-card outline outline-1 outline-black/5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-extrabold">Orders</h2>
            <Link href="/business/orders" className="text-sm font-semibold text-deal">
              Manage
            </Link>
          </div>
          <p className="text-sm text-muted">Accept orders and confirm payments.</p>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card outline outline-1 outline-black/5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
