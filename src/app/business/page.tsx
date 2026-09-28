"use client";

import { useEffect, useMemo, useState } from "react";
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

type TimeseriesPoint = {
  date: string;
  orders: number;
  completed: number;
  gmv: string;
};

type TimeseriesPayload = {
  days: number;
  series: TimeseriesPoint[];
};

export default function BusinessDashboardPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [series, setSeries] = useState<TimeseriesPoint[]>([]);
  const [days, setDays] = useState(30);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<BusinessOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<BusinessProfile>("/api/business/profile", { auth: true }),
      api<BusinessStats>("/api/business/stats", { auth: true }),
      api<TimeseriesPayload>("/api/business/stats/timeseries", {
        auth: true,
        query: { days },
      }).catch(() => ({ days, series: [] as TimeseriesPoint[] })),
      api<Branch[]>("/api/business/branches", { auth: true }),
      api<Product[] | { results: Product[] }>("/api/business/products", { auth: true }),
      api<BusinessOrder[] | { results: BusinessOrder[] }>("/api/business/orders", {
        auth: true,
        query: { page_size: 10 },
      }),
    ])
      .then(([p, s, ts, b, productsPayload, ordersPayload]) => {
        setProfile(p);
        setStats(s);
        setSeries(ts.series || []);
        setBranches(Array.isArray(b) ? b : []);
        const productList = pageResults(productsPayload);
        setProducts(productList);
        setRecentOrders(pageResults(ordersPayload).slice(0, 6));
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [days]);

  const pending =
    stats?.by_status.find((row) => row.status === "pending")?.count ?? 0;
  const paymentSubmitted =
    stats?.by_status.find((row) => row.status === "payment_submitted")?.count ?? 0;
  const needsAction = recentOrders.filter(
    (o) => o.status === "pending" || o.status === "payment_submitted",
  );
  const maxStatus = Math.max(1, ...(stats?.by_status.map((row) => row.count) ?? [1]));
  const lowStockProducts = useMemo(
    () =>
      products
        .filter((p) => p.is_low_stock || (p.stock_quantity != null && p.stock_quantity <= 5))
        .sort((a, b) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0)),
    [products],
  );
  const lowStockCount = stats?.low_stock_count ?? lowStockProducts.length;

  const checklist = useMemo(() => {
    const hasLogo = Boolean(profile?.logo_url || profile?.logo);
    const hasBranch = branches.length > 0;
    const hasListing = products.length > 0;
    const hasPresence = Boolean(profile?.presence_mode);
    const items = [
      {
        done: hasLogo,
        label: "Add a business logo",
        href: "/business/settings",
      },
      {
        done: hasBranch,
        label: "Create your first branch",
        href: "/business/branches/new",
      },
      {
        done: hasListing,
        label: "Publish a listing",
        href: "/business/products/new",
      },
      {
        done: hasPresence,
        label: "Set presence & coverage",
        href: "/business/settings",
      },
    ];
    const remaining = items.filter((i) => !i.done).length;
    return { items, remaining };
  }, [profile, branches, products]);

  const chart = useMemo(() => {
    const maxOrders = Math.max(1, ...series.map((p) => p.orders));
    const maxGmv = Math.max(1, ...series.map((p) => Number(p.gmv) || 0));
    const rangeGmv = series.reduce((sum, p) => sum + (Number(p.gmv) || 0), 0);
    const rangeOrders = series.reduce((sum, p) => sum + p.orders, 0);
    return { maxOrders, maxGmv, rangeGmv, rangeOrders };
  }, [series]);

  return (
    <div>
      <PageHeader
        title={profile?.name || "Dashboard"}
        subtitle="Sales, catalog health, and orders that need action"
        actions={
          profile?.verification_status ? (
            <Badge
              tone={
                profile.verification_status === "verified"
                  ? "success"
                  : profile.verification_status === "suspended"
                    ? "danger"
                    : "warning"
              }
            >
              {profile.verification_status === "under_review"
                ? "Under review"
                : profile.verification_status === "verified"
                  ? "Verified"
                  : profile.verification_status === "suspended"
                    ? "Suspended"
                    : profile.verification_status}
            </Badge>
          ) : null
        }
      />
      {profile?.verification_status && profile.verification_status !== "verified" ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {profile.verification_status === "suspended"
            ? "Your shop is suspended and hidden from customers. Contact Aajhee support."
            : "Your shop is under review. You can add listings, but customers will not see your store until an admin verifies you."}
          {profile.is_paused ? " Pause shop is also on." : ""}
        </p>
      ) : profile?.is_paused ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Pause shop is on — your store is hidden from customers.
        </p>
      ) : null}
      {error ? <ErrorBox message={error} /> : null}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          {checklist.remaining > 0 ? (
            <section className="card mb-6 border border-line p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold">Get set up</h2>
                  <p className="text-sm text-muted">
                    {checklist.remaining} step{checklist.remaining === 1 ? "" : "s"} left before customers can order smoothly
                  </p>
                </div>
              </div>
              <ul className="space-y-2">
                {checklist.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-paper ${
                        item.done ? "text-muted line-through" : "font-semibold"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${
                          item.done ? "bg-emerald-100 text-emerald-800" : "bg-paper text-muted"
                        }`}
                      >
                        {item.done ? "✓" : ""}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {(pending > 0 || paymentSubmitted > 0 || needsAction.length > 0) && (
            <section className="card mb-6 border border-deal/20 bg-deal-soft/40 p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold">Needs action</h2>
                  <p className="text-sm text-muted">
                    {[
                      pending ? `${pending} to accept` : null,
                      paymentSubmitted ? `${paymentSubmitted} payment proofs` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Orders waiting on you"}
                  </p>
                </div>
                <Link href="/business/orders?status=pending" className="text-sm font-semibold text-deal">
                  Open queue
                </Link>
              </div>
              {needsAction.length === 0 ? (
                <p className="text-sm text-muted">
                  Check the orders list — some may be outside the recent feed.
                </p>
              ) : (
                <div className="divide-y divide-line/80">
                  {needsAction.slice(0, 5).map((order) => (
                    <Link
                      key={order.public_id}
                      href={`/business/orders/${order.public_id}`}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm hover:bg-white/50"
                    >
                      <div>
                        <p className="font-semibold">
                          {order.branch_name} · {rs(order.total)}
                        </p>
                        <p className="text-muted">
                          {order.customer_name || order.customer_phone || "Customer"} ·{" "}
                          {labelFulfillment(order.fulfillment_type)}
                        </p>
                      </div>
                      <Badge tone={statusTone(order.status)}>{labelStatus(order.status)}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {lowStockCount > 0 ? (
            <section className="card mb-6 border border-amber-200 bg-amber-50/50 p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold">Low stock</h2>
                  <p className="text-sm text-muted">
                    {lowStockCount} listing{lowStockCount === 1 ? "" : "s"} at or below{" "}
                    {stats?.low_stock_threshold ?? 5} units
                  </p>
                </div>
                <Link
                  href="/business/products?stock=low"
                  className="text-sm font-semibold text-deal"
                >
                  View listings
                </Link>
              </div>
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted">Open listings to review inventory.</p>
              ) : (
                <div className="divide-y divide-line/80">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <Link
                      key={product.id}
                      href={`/business/products/${product.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm hover:bg-white/50"
                    >
                      <p className="font-semibold">{product.name}</p>
                      <Badge tone="warning">
                        {product.stock_quantity === 0
                          ? "Out of stock"
                          : `${product.stock_quantity} left`}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Sales"
              value={rs(stats?.gmv)}
              hint={`${stats?.completed_orders ?? 0} completed orders`}
            />
            <StatCard
              label="Needs action"
              value={pending + paymentSubmitted}
              hint={
                pending || paymentSubmitted
                  ? `${pending} pending · ${paymentSubmitted} proofs`
                  : "All clear"
              }
              href="/business/orders?status=pending"
            />
            <StatCard
              label="Active listings"
              value={stats?.active_product_count ?? products.filter((p) => p.is_enabled !== false).length}
              hint={`${stats?.product_count ?? products.length} total listings`}
              href="/business/products"
            />
            <StatCard
              label="Low stock"
              value={lowStockCount}
              hint={
                lowStockCount
                  ? `At or below ${stats?.low_stock_threshold ?? 5} units`
                  : "Inventory looks healthy"
              }
              href="/business/products?stock=low"
            />
          </div>

          <section className="card mt-6 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Orders & sales</h2>
                <p className="text-sm text-muted">
                  Last {days} days · {chart.rangeOrders} orders · {rs(chart.rangeGmv)} completed sales
                </p>
              </div>
              <div className="flex gap-2">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                      days === d ? "bg-deal text-white" : "border border-line hover:bg-paper"
                    }`}
                    onClick={() => setDays(d)}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            {!series.length ? (
              <p className="text-sm text-muted">No activity in this range yet.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Orders / day</p>
                  <div className="flex h-28 items-end gap-0.5">
                    {series.map((point) => (
                      <div
                        key={`o-${point.date}`}
                        className="group relative min-w-0 flex-1 rounded-t bg-deal/80 hover:bg-deal"
                        style={{ height: `${Math.max(4, (point.orders / chart.maxOrders) * 100)}%` }}
                        title={`${point.date}: ${point.orders} orders`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Completed sales / day</p>
                  <div className="flex h-28 items-end gap-0.5">
                    {series.map((point) => {
                      const gmv = Number(point.gmv) || 0;
                      return (
                        <div
                          key={`g-${point.date}`}
                          className="group relative min-w-0 flex-1 rounded-t bg-ink/70 hover:bg-ink"
                          style={{ height: `${Math.max(4, (gmv / chart.maxGmv) * 100)}%` }}
                          title={`${point.date}: ${rs(point.gmv)}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>

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
