"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge, Empty, ErrorBox, PageHeader, inputClass } from "@/components/ui";
import { api, pageResults } from "@/lib/api";
import {
  formatDateTime,
  labelFulfillment,
  labelPayment,
  labelStatus,
  nextActions,
  STATUS_ACTION_LABELS,
  statusTone,
} from "@/lib/commerce";
import { errorMessage } from "@/lib/errors";
import { rs } from "@/lib/format";
import type { Branch, BusinessOrder, OrderStatus } from "@/lib/types";

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "awaiting_payment", label: "Awaiting payment" },
  { value: "payment_submitted", label: "Payment submitted" },
  { value: "paid_confirmed", label: "Paid" },
  { value: "preparing", label: "Preparing" },
  { value: "ready_for_pickup", label: "Ready" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersClient() {
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get("status") || "";
  const [orders, setOrders] = useState<BusinessOrder[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const status = statusOverride ?? urlStatus;
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(() => {
    api<BusinessOrder[] | { results: BusinessOrder[] }>("/api/business/orders", {
      auth: true,
      query: {
        status: status || undefined,
        branch_id: branchId || undefined,
      },
    })
      .then((data) => {
        setOrders(pageResults(data));
        setUpdatedAt(new Date());
      })
      .catch((err) => setError(errorMessage(err)));
  }, [status, branchId]);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 30000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  useEffect(() => {
    api<Branch[]>("/api/business/branches", { auth: true })
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch(() => undefined);
  }, []);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const order of orders) {
      map[order.status] = (map[order.status] || 0) + 1;
    }
    return map;
  }, [orders]);

  async function setOrderStatus(publicId: string, next: OrderStatus) {
    setBusyId(publicId);
    setError("");
    try {
      await api(`/api/business/orders/${publicId}/status`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ status: next }),
      });
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={
          updatedAt
            ? `Auto-refreshes every 30s · last update ${updatedAt.toLocaleTimeString()}`
            : "Accept, fulfill, and confirm payments"
        }
      />
      {error ? <ErrorBox message={error} /> : null}

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          className={`${inputClass} w-auto min-w-[160px]`}
          value={status}
          onChange={(e) => setStatusOverride(e.target.value)}
        >
          {STATUS_FILTERS.map((filter) => (
            <option key={filter.value || "all"} value={filter.value}>
              {filter.label}
              {!filter.value && orders.length ? ` (${orders.length})` : ""}
              {filter.value && counts[filter.value] ? ` (${counts[filter.value]})` : ""}
            </option>
          ))}
        </select>
        <select
          className={`${inputClass} w-auto min-w-[180px]`}
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
        >
          <option value="">All branches</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-xl border border-line px-3 py-2 text-sm font-semibold hover:bg-paper"
          onClick={() => load()}
        >
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <Empty title="No orders" body="Orders matching this filter will appear here." />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const actions = nextActions(order);
            return (
              <article key={order.public_id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/business/orders/${order.public_id}`}
                        className="font-semibold hover:text-deal"
                      >
                        {order.branch_name} · {rs(order.total)}
                      </Link>
                      <Badge tone={statusTone(order.status)}>{labelStatus(order.status)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      #{order.public_id.slice(0, 8)} · {formatDateTime(order.placed_at)} ·{" "}
                      {labelFulfillment(order.fulfillment_type)} · {labelPayment(order.payment_method)}
                    </p>
                    {(order.customer_name || order.customer_phone) && (
                      <p className="mt-1 text-sm">
                        {order.customer_name || "Customer"}
                        {order.customer_phone ? ` · ${order.customer_phone}` : ""}
                      </p>
                    )}
                    {order.items?.length ? (
                      <p className="mt-1 text-sm text-muted">
                        {order.items
                          .slice(0, 3)
                          .map((item) => `${item.quantity}× ${item.product_name}`)
                          .join(" · ")}
                        {order.items.length > 3 ? ` · +${order.items.length - 3} more` : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/business/orders/${order.public_id}`}
                      className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:bg-paper"
                    >
                      View details
                    </Link>
                    {actions.map((next) => (
                      <button
                        key={next}
                        type="button"
                        disabled={busyId === order.public_id}
                        className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                          next === "cancelled"
                            ? "border border-line hover:bg-paper"
                            : "bg-deal text-white"
                        }`}
                        onClick={() => void setOrderStatus(order.public_id, next)}
                      >
                        {STATUS_ACTION_LABELS[next] || labelStatus(next)}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
