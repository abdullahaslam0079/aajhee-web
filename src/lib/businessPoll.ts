"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, pageResults } from "@/lib/api";
import type { BusinessOrder } from "@/lib/types";

const ACTION_STATUSES = ["pending", "payment_submitted"] as const;

export type ActionCounts = {
  pending: number;
  paymentSubmitted: number;
  total: number;
};

async function fetchActionCounts(): Promise<ActionCounts> {
  const [pending, proofs] = await Promise.all([
    api<BusinessOrder[] | { results: BusinessOrder[] }>("/api/business/orders", {
      auth: true,
      query: { status: "pending" },
    }).catch(() => []),
    api<BusinessOrder[] | { results: BusinessOrder[] }>("/api/business/orders", {
      auth: true,
      query: { status: "payment_submitted" },
    }).catch(() => []),
  ]);
  const pendingCount = pageResults(pending).length;
  const proofCount = pageResults(proofs).length;
  return {
    pending: pendingCount,
    paymentSubmitted: proofCount,
    total: pendingCount + proofCount,
  };
}

export function useActionCounts(enabled: boolean, intervalMs = 30000) {
  const [counts, setCounts] = useState<ActionCounts>({
    pending: 0,
    paymentSubmitted: 0,
    total: 0,
  });
  const mounted = useRef(true);

  const refresh = useCallback(() => {
    if (!enabled) return;
    fetchActionCounts()
      .then((next) => {
        if (mounted.current) setCounts(next);
      })
      .catch(() => undefined);
  }, [enabled]);

  useEffect(() => {
    mounted.current = true;
    refresh();
    if (!enabled) return;
    const id = window.setInterval(refresh, intervalMs);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, intervalMs, refresh]);

  return { counts, refresh, actionStatuses: ACTION_STATUSES };
}

export function useUnreadNotifications(enabled: boolean, intervalMs = 30000) {
  const [unread, setUnread] = useState(0);
  const mounted = useRef(true);

  const refresh = useCallback(() => {
    if (!enabled) return;
    api<{ unread_count: number }>("/api/business/notifications/unread-count", {
      auth: true,
    })
      .then((data) => {
        if (mounted.current) setUnread(data.unread_count || 0);
      })
      .catch(() => {
        if (mounted.current) setUnread(0);
      });
  }, [enabled]);

  useEffect(() => {
    mounted.current = true;
    refresh();
    if (!enabled) return;
    const id = window.setInterval(refresh, intervalMs);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, intervalMs, refresh]);

  return { unread, refresh };
}
