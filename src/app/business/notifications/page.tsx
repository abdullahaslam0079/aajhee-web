"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Empty, ErrorBox, PageHeader, Skeleton } from "@/components/ui";
import { api, pageResults } from "@/lib/api";
import { formatDateTime } from "@/lib/commerce";
import { errorMessage } from "@/lib/errors";
import type { BusinessNotification } from "@/lib/types";

export default function BusinessNotificationsPage() {
  const [items, setItems] = useState<BusinessNotification[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api<{ results?: BusinessNotification[] } | BusinessNotification[]>(
      "/api/business/notifications",
      { auth: true },
    )
      .then((data) => setItems(pageResults(data as { results?: BusinessNotification[] })))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

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

  async function markRead(id: number) {
    try {
      await api(`/api/business/notifications/${id}/read`, {
        method: "POST",
        auth: true,
      });
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function markAll() {
    try {
      await api("/api/business/notifications/read-all", {
        method: "POST",
        auth: true,
      });
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function hrefFor(item: BusinessNotification) {
    const route = item.data?.route;
    if (typeof route === "string" && route.startsWith("/business")) return route;
    const publicId = item.data?.order_public_id;
    if (typeof publicId === "string") return `/business/orders/${publicId}`;
    return "/business/orders";
  }

  return (
    <div>
      <PageHeader
        title="Alerts"
        subtitle="New orders and payment proofs — refreshes every 30s"
        actions={
          items.some((i) => !i.is_read && !i.read_at) ? (
            <Button type="button" variant="ghost" onClick={() => void markAll()}>
              Mark all read
            </Button>
          ) : null
        }
      />
      {error ? <ErrorBox message={error} /> : null}
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : items.length === 0 ? (
        <Empty title="No alerts yet" body="New orders and payment proofs will show up here." />
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const unread = !item.is_read && !item.read_at;
            return (
              <article
                key={item.id}
                className={`card flex flex-wrap items-start justify-between gap-3 p-4 ${
                  unread ? "ring-1 ring-deal/30" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.title}</p>
                    {unread ? <Badge tone="warning">New</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted">{item.body}</p>
                  <p className="mt-1 text-xs text-muted">{formatDateTime(item.created_at)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={hrefFor(item)}
                    className="rounded-lg bg-deal px-3 py-1.5 text-sm font-semibold text-white"
                    onClick={() => {
                      if (unread) void markRead(item.id);
                    }}
                  >
                    Open
                  </Link>
                  {unread ? (
                    <button
                      type="button"
                      className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold"
                      onClick={() => void markRead(item.id)}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
