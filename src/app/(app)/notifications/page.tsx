"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Empty, ErrorBox } from "@/components/ui";
import { api, pageResults } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useAuth } from "@/lib/useAuth";
import type { NotificationItem, Paginated } from "@/lib/types";

export default function NotificationsPage() {
  const { loggedIn } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState("");

  function load() {
    return api<Paginated<NotificationItem>>("/api/notifications", { auth: true })
      .then((data) => setItems(pageResults(data)))
      .catch((err) => setError(errorMessage(err)));
  }

  useEffect(() => {
    if (!loggedIn) {
      router.replace("/login");
      return;
    }
    load();
  }, [loggedIn, router]);

  async function markAll() {
    await api("/api/notifications/read-all", { method: "POST", auth: true });
    load();
  }

  if (!loggedIn) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="mb-4 font-display text-2xl font-semibold tracking-tight">Notifications</h1>
        {items.length ? (
          <Button type="button" variant="ghost" onClick={markAll}>
            Mark all read
          </Button>
        ) : null}
      </div>
      {error ? <ErrorBox message={error} /> : null}
      {items.length === 0 && !error ? (
        <Empty title="You’re all caught up" body="New deals from saved stores will show up here." />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl p-4 shadow-card outline outline-1 outline-black/5 ${
                item.is_read === false ? "bg-deal-soft/60" : "bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-bold">{item.title || "Goluto"}</p>
                {item.created_at ? (
                  <span className="shrink-0 text-xs text-muted">
                    {new Date(item.created_at).toLocaleDateString("de-DE")}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted">{item.body || item.message}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
