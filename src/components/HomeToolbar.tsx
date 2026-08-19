"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BellIcon, HeartIcon, PinIcon } from "@/components/icons";
import { useAuth } from "@/lib/useAuth";
import { requestBrowserLocation } from "@/lib/location";
import { useLocation } from "@/lib/useLocation";
import { api } from "@/lib/api";

export function HomeToolbar() {
  const loc = useLocation();
  const { loggedIn } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!loggedIn) return;
    api<{ unread_count: number }>("/api/notifications/unread-count", { auth: true })
      .then((data) => setUnread(data.unread_count || 0))
      .catch(() => setUnread(0));
  }, [loggedIn]);

  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <button
        type="button"
        onClick={() => requestBrowserLocation().catch(() => undefined)}
        className="min-w-0 text-left"
      >
        <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          <PinIcon size={12} /> Near you
        </p>
        <p className="truncate font-display text-[1.85rem] font-semibold leading-tight tracking-tight">
          {loc.label || "Berlin"}
        </p>
        <p className="mt-0.5 text-sm text-muted">Tap to use your current location</p>
      </button>
      <div className="flex items-center gap-2 pt-1">
        <Link
          href="/favorites"
          className="grid h-11 w-11 place-items-center rounded-xl bg-white text-ink shadow-card outline outline-1 outline-black/5 transition hover:shadow-lift"
          aria-label="Favorites"
        >
          <HeartIcon size={18} />
        </Link>
        <Link
          href="/notifications"
          className="relative grid h-11 w-11 place-items-center rounded-xl bg-white text-ink shadow-card outline outline-1 outline-black/5 transition hover:shadow-lift"
          aria-label="Alerts"
        >
          <BellIcon size={18} />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-deal px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          ) : null}
        </Link>
      </div>
    </div>
  );
}
