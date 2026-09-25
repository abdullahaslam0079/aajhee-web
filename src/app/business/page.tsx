"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Empty, ErrorBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { Branch, BusinessProfile } from "@/lib/types";

type Listing = { id: number; name: string; is_enabled?: boolean };

export default function BusinessDashboardPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<BusinessProfile>("/api/business/profile", { auth: true }),
      api<Branch[]>("/api/business/branches", { auth: true }),
      api<Listing[]>("/api/business/products", { auth: true }),
      api<unknown[]>("/api/business/orders", { auth: true }).catch(() => []),
    ])
      .then(([p, b, products, orders]) => {
        setProfile(p);
        setBranches(Array.isArray(b) ? b : []);
        setListings(Array.isArray(products) ? products : []);
        setOrdersCount(Array.isArray(orders) ? orders.length : 0);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const activeListings = listings.filter((item) => item.is_enabled !== false).length;

  return (
    <div>
      <PageHeader title={profile?.name || "Dashboard"} />
      {error ? <ErrorBox message={error} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Branches" value={branches.length} />
        <Stat label="Listings" value={listings.length} />
        <Stat label="Active listings" value={activeListings} />
        <Stat label="Orders" value={ordersCount} />
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
            <h2 className="font-extrabold">Listings</h2>
            <Link href="/business/products" className="text-sm font-semibold text-deal">
              Manage
            </Link>
          </div>
          <p className="text-sm text-muted">Add products with photos for customers to order.</p>
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
