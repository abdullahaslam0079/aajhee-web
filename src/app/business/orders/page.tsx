"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Empty, ErrorBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

type Order = {
  public_id: string;
  status: string;
  fulfillment_type: string;
  payment_method: string;
  total: string;
  branch_name?: string;
};

export default function BusinessOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  function load() {
    api<Order[]>("/api/business/orders", { auth: true })
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => setError(errorMessage(err)));
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(publicId: string, status: string) {
    try {
      await api(`/api/business/orders/${publicId}/status`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader title="Orders" subtitle="Accept, fulfill, and confirm payments" />
      {error ? <ErrorBox message={error} /> : null}
      {orders.length === 0 ? (
        <Empty title="No orders yet" />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.public_id} className="rounded-2xl bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {o.branch_name} · Rs {o.total}
                  </p>
                  <p className="text-sm text-muted">
                    {o.status} · {o.fulfillment_type} · {o.payment_method}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {o.status === "pending" ? (
                    <button
                      className="rounded-lg bg-deal px-3 py-1.5 text-sm font-semibold text-white"
                      onClick={() => setStatus(o.public_id, "accepted")}
                    >
                      Accept
                    </button>
                  ) : null}
                  <button
                    className="rounded-lg border border-line px-3 py-1.5 text-sm"
                    onClick={() => setStatus(o.public_id, "cancelled")}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-sm text-muted">
        <Link href="/business" className="text-deal font-semibold">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
