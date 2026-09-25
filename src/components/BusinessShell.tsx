"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearSession } from "@/lib/auth";
import { useAuth } from "@/lib/useAuth";

const links = [
  { href: "/business", label: "Dashboard" },
  { href: "/business/branches", label: "Branches" },
  { href: "/business/products", label: "Products" },
  { href: "/business/orders", label: "Orders" },
  { href: "/business/offers", label: "Offers" },
];

export function BusinessShell({ children }: { children: React.ReactNode }) {
  const { loggedIn, role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loggedIn || role !== "business") {
      router.replace("/business/login");
    }
  }, [loggedIn, role, router]);

  if (!loggedIn || role !== "business") {
    return <div className="grid min-h-dvh place-items-center text-sm text-muted">Loading…</div>;
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/business" className="flex items-center gap-2.5">
            <img src="/icon.png" alt="" className="h-8 w-8 rounded-lg shadow-sm ring-1 ring-black/5" />
            <span className="font-display font-semibold tracking-tight">Aajhee Business</span>
          </Link>
          <nav className="flex items-center gap-1 rounded-xl bg-paper p-1">
            {links.map((link) => {
              const active = link.href === "/business" ? pathname === "/business" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    active
                      ? "bg-ink !text-white shadow-sm"
                      : "text-muted hover:bg-white hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            className="text-sm font-semibold text-muted hover:text-ink"
            onClick={() => {
              clearSession();
              router.replace("/business/login");
            }}
          >
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
