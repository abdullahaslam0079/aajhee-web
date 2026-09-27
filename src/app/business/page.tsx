"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Empty, ErrorBox, PageHeader, Skeleton, StatCard } from "@/components/ui";
import { api, pageResults } from "@/lib/api";
import {
  formatDateTime,
  labelFulfillment,
  labelPayment,
  labelStatus,
  statusTone,
} from "@/lib/commerce";
import { errorMessage } from "@/lib/errors";
import { rs } from "@/lib/format";
import type { Branch, BusinessOrder, BusinessProfile, BusinessStats, Product } from "@/lib/types";

export default function BusinessDashboardPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<BusinessOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<BusinessProfile>("/api/business/profile", { auth: true }),
      api<BusinessStats>("/api/business/stats", { auth: true }),
      api<Branch[]>("/api/business/branches", { auth: true }),
      api<Product[] | { results: Product[] }>("/api/business/products", { auth: true }),
      api<BusinessOrder[] | { results: BusinessOrder[] }>("/api/business/orders", { auth: true }),
    ])
      .then(([p, s, b, productsPayload, ordersPayload]) => {
        setProfile(p);
        setStats(s);
        setBranches(Array.isArray(b) ? b : []);
        const productList = pageResults(productsPayload);
        setProducts(productList);
        setRecentOrders(pageResults(ordersPayload).slice(0, 6));
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const pending =
    stats?.by_status.find((row) => row.status === "pending")?.count ?? 0;
  const maxStatus = Math.max(1, ...(stats?.by_status.map((row) => row.count) ?? [1]));

  return (
    <div>
      <PageHeader
        title={profile?.name || "Dashboard"}
        subtitle="Sales, catalog health, and orders that need action"
      />
      {error ? <ErrorBox message={error} /> : null}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Revenue (completed)"
              value={rs(stats?.gmv)}
              hint={`${stats?.completed_orders ?? 0} completed orders`}
            />
            <StatCard
              label="Total orders"
              value={stats?.total_orders ?? 0}
              hint={pending ? `${pending} waiting for accept` : "No pending orders"}
              href="/business/orders"
            />
            <StatCard
              label="Active listings"
              value={stats?.active_product_count ?? products.filter((p) => p.is_enabled !== false).length}
              hint={`${stats?.product_count ?? products.length} total listings`}
              href="/business/products"
            />
            <StatCard
              label="Branches"
              value={branches.length}
              hint={branches[0]?.name || "Add your first branch"}
              href="/business/branches"
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <section className="card p-5 lg:col-span-1">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Orders by status</h2>
              </div>
              {!stats?.by_status.length ? (
                <p className="text-sm text-muted">No order activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {stats.by_status.map((row) => (
                    <div key={row.status}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium">{labelStatus(row.status)}</span>
                        <span className="text-muted">{row.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-paper">
                        <div
                          className="h-full rounded-full bg-deal"
                          style={{ width: `${(row.count / maxStatus) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card p-5 lg:col-span-1">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Top products</h2>
                <Link href="/business/products" className="text-sm font-semibold text-deal">
                  Manage
                </Link>
              </div>
              {!stats?.by_product.length ? (
                <p className="text-sm text-muted">Completed sales will rank products here.</p>
              ) : (
                <div className="space-y-3">
                  {stats.by_product.slice(0, 5).map((row) => (
                    <div key={`${row.product_id}-${row.product_name}`} className="flex justify-between gap-3 text-sm">
                      <div>
                        <p className="font-semibold">{row.product_name || "Deleted product"}</p>
                        <p className="text-muted">{row.quantity} sold</p>
                      </div>
                      <p className="font-semibold">{rs(row.gmv)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card p-5 lg:col-span-1">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">By branch</h2>
                <Link href="/business/branches" className="text-sm font-semibold text-deal">
                  Manage
                </Link>
              </div>
              {!stats?.by_branch.length ? (
                <div className="space-y-2">
                  {branches.slice(0, 4).map((branch) => (
                    <p key={branch.id} className="border-t border-line py-2 text-sm first:border-0 first:pt-0">
                      <span className="font-semibold">{branch.name}</span>
                      <span className="text-muted"> · {branch.city}</span>
                    </p>
                  ))}
                  {!branches.length ? <Empty title="No branches yet" /> : null}
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.by_branch.map((row) => (
                    <div key={row.branch_id} className="flex justify-between gap-3 text-sm">
                      <div>
                        <p className="font-semibold">{row.branch_name}</p>
                        <p className="text-muted">{row.order_count} orders</p>
                      </div>
                      <p className="font-semibold">{rs(row.gmv)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="card mt-6 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Recent orders</h2>
              <Link href="/business/orders" className="text-sm font-semibold text-deal">
                View all
              </Link>
            </div>
            {!recentOrders.length ? (
              <Empty title="No orders yet" body="Orders from customers will show up here." />
            ) : (
              <div className="divide-y divide-line">
                {recentOrders.map((order) => (
                  <Link
                    key={order.public_id}
                    href={`/business/orders/${order.public_id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 transition hover:bg-paper/60"
                  >
                    <div>
                      <p className="font-semibold">
                        {order.branch_name} · {rs(order.total)}
                      </p>
                      <p className="text-sm text-muted">
                        {formatDateTime(order.placed_at)} · {labelFulfillment(order.fulfillment_type)} ·{" "}
                        {labelPayment(order.payment_method)}
                      </p>
                    </div>
                    <Badge tone={statusTone(order.status)}>{labelStatus(order.status)}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
