"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession } from "@/lib/auth";
import { useActionCounts, useUnreadNotifications } from "@/lib/businessPoll";
import { useAuth } from "@/lib/useAuth";
import {
  BellIcon,
  HomeIcon,
  PackageIcon,
  ReceiptIcon,
  SettingsIcon,
  StoreIcon,
} from "./icons";

const links = [
  { href: "/business", label: "Dashboard", icon: HomeIcon, exact: true },
  { href: "/business/orders", label: "Orders", icon: ReceiptIcon },
  { href: "/business/products", label: "Listings", icon: PackageIcon },
  { href: "/business/branches", label: "Branches", icon: StoreIcon },
  { href: "/business/notifications", label: "Alerts", icon: BellIcon },
  { href: "/business/settings", label: "Settings", icon: SettingsIcon },
];

export function BusinessShell({ children }: { children: React.ReactNode }) {
  const { loggedIn, role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const enabled = loggedIn && role === "business";
  const { counts } = useActionCounts(Boolean(enabled));
  const { unread } = useUnreadNotifications(Boolean(enabled));

  useEffect(() => {
    if (!loggedIn || role !== "business") {
      router.replace("/business/login");
    }
  }, [loggedIn, role, router]);

  if (!loggedIn || role !== "business") {
    return <div className="grid min-h-dvh place-items-center text-sm text-muted">Loading…</div>;
  }

  const nav = (
    <nav className="grid gap-1 px-3">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;
        const badge =
          link.href === "/business/orders"
            ? counts.total
            : link.href === "/business/notifications"
              ? unread
              : 0;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-white/10 text-white shadow-[inset_3px_0_0_0_#c45f5f]"
                : "text-white/55 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon size={18} />
            <span className="flex-1">{link.label}</span>
            {badge > 0 ? (
              <span className="rounded-full bg-deal px-2 py-0.5 text-[11px] font-bold text-white">
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden bg-[#1c1716] text-white lg:flex lg:flex-col">
        <Link href="/business" className="flex items-center gap-2.5 px-5 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" className="h-8 w-8 rounded-lg shadow-sm ring-1 ring-white/10" />
          <div>
            <p className="font-display text-base font-semibold tracking-tight">Aajhee</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">Business</p>
          </div>
        </Link>
        {nav}
        <div className="mt-auto border-t border-white/10 p-4">
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/55 transition hover:bg-white/5 hover:text-white"
            onClick={() => {
              clearSession();
              router.replace("/business/login");
            }}
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/60 bg-white/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Link href="/business" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="" className="h-8 w-8 rounded-lg" />
            <span className="font-display font-semibold">Aajhee Business</span>
          </Link>
          <div className="flex items-center gap-2">
            {counts.total > 0 ? (
              <Link
                href="/business/orders?status=pending"
                className="rounded-full bg-deal px-2.5 py-1 text-xs font-bold text-white"
              >
                {counts.total} action
              </Link>
            ) : null}
            <button
              type="button"
              className="rounded-xl bg-paper px-3 py-2 text-sm font-semibold"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </header>
        {menuOpen ? (
          <div className="border-b border-line bg-[#1c1716] py-3 lg:hidden">{nav}</div>
        ) : null}
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
