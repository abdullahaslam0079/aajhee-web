"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge, Empty, ErrorBox, Field, PageHeader, inputClass } from "@/components/ui";
import { api, pageMeta, pageResults } from "@/lib/api";
import {
  formatDateTime,
  isSameDayOrder,
  labelFulfillment,
  labelPayment,
  labelPaymentStatus,
  labelStatus,
  nextActions,
  STATUS_ACTION_LABELS,
  statusTone,
} from "@/lib/commerce";
import { errorMessage } from "@/lib/errors";
import { rs } from "@/lib/format";
import { whatsappHref } from "@/lib/merchantAlerts";
import type { Branch, BusinessOrder, OrderStatus } from "@/lib/types";

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "awaiting_payment", label: "Awaiting payment" },
  { value: "payment_submitted", label: "Payment submitted" },
  { value: "paid_confirmed", label: "Paid" },
  { value: "preparing", label: "Preparing" },
  { value: "ready_for_pickup", label: "Ready for pickup" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE = 20;

export default function OrdersClient() {
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get("status") || "";
  const [orders, setOrders] = useState<BusinessOrder[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const status = statusOverride ?? urlStatus;
  const [branchId, setBranchId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [cancelFor, setCancelFor] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const load = useCallback(() => {
    api<BusinessOrder[] | { results: BusinessOrder[]; count?: number; page?: number; page_size?: number }>(
      "/api/business/orders",
      {
        auth: true,
        query: {
          status: status || undefined,
          branch_id: branchId || undefined,
          search: search || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          page,
          page_size: PAGE_SIZE,
        },
      },
    )
      .then((data) => {
        setOrders(pageResults(data));
        setTotalCount(pageMeta(data).count);
        setUpdatedAt(new Date());
      })
      .catch((err) => setError(errorMessage(err)));
  }, [status, branchId, search, dateFrom, dateTo, page]);

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

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  async function setOrderStatus(publicId: string, next: OrderStatus, reason?: string) {
    setBusyId(publicId);
    setError("");
    try {
      await api(`/api/business/orders/${publicId}/status`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          status: next,
          reason: next === "cancelled" ? reason : undefined,
        }),
      });
      setCancelFor(null);
      setCancelReason("");
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  function onAction(publicId: string, next: OrderStatus) {
    if (next === "cancelled") {
      setCancelFor(publicId);
      setCancelReason("");
      return;
    }
    void setOrderStatus(publicId, next);
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

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Field label="Search">
            <input
              className={inputClass}
              placeholder="Order ID, customer, phone…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </Field>
        </div>
        <div className="w-auto min-w-[160px]">
          <Field label="Status">
            <select
              className={inputClass}
              value={status}
              onChange={(e) => {
                setStatusOverride(e.target.value);
                setPage(1);
              }}
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value || "all"} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="w-auto min-w-[180px]">
          <Field label="Branch">
            <select
              className={inputClass}
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="w-auto">
          <Field label="From date">
            <input
              className={inputClass}
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </Field>
        </div>
        <div className="w-auto">
          <Field label="To date">
            <input
              className={inputClass}
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </Field>
        </div>
        <button
          type="button"
          className="rounded-xl border border-line px-3 py-2 text-sm font-semibold hover:bg-paper"
          onClick={() => load()}
        >
          Refresh
        </button>
      </div>

      {cancelFor ? (
        <div className="card mb-4 space-y-3 border border-deal/20 p-4">
          <p className="font-semibold">Cancel order #{cancelFor.slice(0, 8)}</p>
          <Field label="Cancel reason (required)">
            <input
              className={inputClass}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Out of stock, closed, customer request…"
              autoFocus
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-deal px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              disabled={!cancelReason.trim() || busyId === cancelFor}
              onClick={() => void setOrderStatus(cancelFor, "cancelled", cancelReason.trim())}
            >
              Confirm cancel
            </button>
            <button
              type="button"
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold"
              onClick={() => {
                setCancelFor(null);
                setCancelReason("");
              }}
            >
              Back
            </button>
          </div>
        </div>
      ) : null}

      {orders.length === 0 ? (
        <Empty title="No orders" body="Orders matching this filter will appear here." />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const actions = nextActions(order);
            const wa = whatsappHref(order.customer_phone);
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
                      {isSameDayOrder(order.fulfillment_type) ? (
                        <Badge tone="deal">Same-day</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      #{order.public_id.slice(0, 8)} · {formatDateTime(order.placed_at)} ·{" "}
                      {labelFulfillment(order.fulfillment_type)} · {labelPayment(order.payment_method)} ·{" "}
                      {labelPaymentStatus(order.payment_status)}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="font-semibold">{order.customer_name || "Customer"}</span>
                      {order.customer_phone ? ` · ${order.customer_phone}` : ""}
                      {wa ? (
                        <>
                          {" · "}
                          <a
                            className="font-semibold text-deal"
                            href={wa}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Chat on WhatsApp
                          </a>
                        </>
                      ) : null}
                    </p>
                    {order.delivery_address_text ? (
                      <p className="mt-1 text-sm text-muted whitespace-pre-wrap">
                        {order.delivery_address_text}
                        {order.delivery_landmark ? ` · Landmark: ${order.delivery_landmark}` : ""}
                      </p>
                    ) : null}
                    {order.customer_notes ? (
                      <p className="mt-1 text-sm">
                        <span className="text-muted">Notes · </span>
                        {order.customer_notes}
                      </p>
                    ) : null}
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
                        onClick={() => onAction(order.public_id, next)}
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

      {totalCount > PAGE_SIZE ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {totalCount} orders · page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-xl border border-line px-3 py-2 text-sm font-semibold disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-xl border border-line px-3 py-2 text-sm font-semibold disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
