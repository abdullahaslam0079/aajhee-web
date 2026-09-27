"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Badge,
  Button,
  Empty,
  ErrorBox,
  Field,
  PageHeader,
  Skeleton,
  inputClass,
} from "@/components/ui";
import { api } from "@/lib/api";
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
import type { BusinessOrder, OrderStatus } from "@/lib/types";

export default function BusinessOrderDetailPage() {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;
  const [order, setOrder] = useState<BusinessOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [reviewNote, setReviewNote] = useState("");

  function load() {
    api<BusinessOrder>(`/api/business/orders/${publicId}`, { auth: true })
      .then(setOrder)
      .catch((err) => setError(errorMessage(err)));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicId]);

  async function setStatus(status: OrderStatus) {
    setBusy(true);
    setError("");
    try {
      const updated = await api<BusinessOrder>(`/api/business/orders/${publicId}/status`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          status,
          reason: status === "cancelled" ? cancelReason : undefined,
        }),
      });
      setOrder(updated);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function reviewProof(proofId: number, review_status: "accepted" | "rejected") {
    setBusy(true);
    setError("");
    try {
      await api(`/api/business/orders/${publicId}/payment-proofs/${proofId}/review`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ review_status, review_note: reviewNote }),
      });
      setReviewNote("");
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!order && !error) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <PageHeader title="Order" />
        <ErrorBox message={error || "Order not found"} />
        <Link href="/business/orders" className="mt-4 inline-block text-sm font-semibold text-deal">
          Back to orders
        </Link>
      </div>
    );
  }

  const actions = nextActions(order);

  return (
    <div>
      <PageHeader
        title={`Order #${order.public_id.slice(0, 8)}`}
        subtitle={`${formatDateTime(order.placed_at)} · ${order.branch_name}`}
        actions={
          <Link href="/business/orders" className="text-sm font-semibold text-muted hover:text-ink">
            ← All orders
          </Link>
        }
      />
      {error ? <ErrorBox message={error} /> : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={statusTone(order.status)}>{labelStatus(order.status)}</Badge>
        <Badge>{labelFulfillment(order.fulfillment_type)}</Badge>
        <Badge>{labelPayment(order.payment_method)}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="card space-y-4 p-5">
          <h2 className="font-semibold">Items</h2>
          {!order.items?.length ? (
            <Empty title="No line items" />
          ) : (
            <div className="divide-y divide-line">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold">
                      {item.quantity}× {item.product_name}
                    </p>
                    <p className="text-muted">
                      {rs(item.unit_sale_price || item.unit_base_price)} each
                      {item.unit_discount_percent && Number(item.unit_discount_percent) > 0
                        ? ` · ${Math.round(Number(item.unit_discount_percent))}% off`
                        : ""}
                    </p>
                  </div>
                  <p className="font-semibold">{rs(item.line_total)}</p>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{rs(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Delivery fee</span>
              <span>{rs(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{rs(order.total)}</span>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <section className="card space-y-3 p-5">
            <h2 className="font-semibold">Delivery</h2>
            <p className="text-sm">
              <span className="text-muted">Method · </span>
              {labelFulfillment(order.fulfillment_type)}
            </p>
            {order.delivery_address_text ? (
              <p className="text-sm whitespace-pre-wrap">{order.delivery_address_text}</p>
            ) : (
              <p className="text-sm text-muted">No delivery address (pickup or not provided).</p>
            )}
            {order.delivery_snapshot?.promised_by ? (
              <p className="text-sm text-muted">
                Promised by {formatDateTime(order.delivery_snapshot.promised_by)}
              </p>
            ) : null}
            {order.customer_notes ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Customer notes</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{order.customer_notes}</p>
              </div>
            ) : null}
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="font-semibold">Actions</h2>
            {actions.length === 0 ? (
              <p className="text-sm text-muted">No further actions for this status.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {actions.map((next) => (
                  <Button
                    key={next}
                    type="button"
                    variant={next === "cancelled" ? "ghost" : "primary"}
                    disabled={busy}
                    onClick={() => void setStatus(next)}
                  >
                    {STATUS_ACTION_LABELS[next] || labelStatus(next)}
                  </Button>
                ))}
              </div>
            )}
            {actions.includes("cancelled") ? (
              <Field label="Cancel reason (optional)">
                <input
                  className={inputClass}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Out of stock, closed, etc."
                />
              </Field>
            ) : null}
            {order.cancelled_at ? (
              <p className="text-sm text-muted">
                Cancelled {formatDateTime(order.cancelled_at)}
                {order.cancelled_by ? ` by ${order.cancelled_by}` : ""}
                {order.cancel_reason ? ` · ${order.cancel_reason}` : ""}
              </p>
            ) : null}
          </section>

          {(order.payment_method === "bank_transfer" || order.payment_proofs?.length > 0) && (
            <section className="card space-y-3 p-5">
              <h2 className="font-semibold">Payment proofs</h2>
              {order.bank_transfer_instructions ? (
                <p className="rounded-xl bg-paper p-3 text-sm whitespace-pre-wrap">
                  {order.bank_transfer_instructions}
                </p>
              ) : null}
              {!order.payment_proofs?.length ? (
                <p className="text-sm text-muted">No payment proof uploaded yet.</p>
              ) : (
                order.payment_proofs.map((proof) => (
                  <div key={proof.id} className="rounded-xl border border-line p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge
                        tone={
                          proof.review_status === "accepted"
                            ? "success"
                            : proof.review_status === "rejected"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {proof.review_status}
                      </Badge>
                      <span className="text-xs text-muted">{formatDateTime(proof.submitted_at)}</span>
                    </div>
                    {proof.file_url ? (
                      <a href={proof.file_url} target="_blank" rel="noreferrer" className="mt-2 block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={proof.file_url}
                          alt="Payment proof"
                          className="max-h-48 rounded-lg object-contain"
                        />
                      </a>
                    ) : null}
                    {proof.note ? <p className="mt-2 text-sm text-muted">{proof.note}</p> : null}
                    {proof.review_status === "pending" ? (
                      <div className="mt-3 space-y-2">
                        <Field label="Review note">
                          <input
                            className={inputClass}
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="Optional note to customer"
                          />
                        </Field>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            disabled={busy}
                            onClick={() => void reviewProof(proof.id, "accepted")}
                          >
                            Accept payment
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => void reviewProof(proof.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ) : proof.review_note ? (
                      <p className="mt-2 text-sm text-muted">Note: {proof.review_note}</p>
                    ) : null}
                  </div>
                ))
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
