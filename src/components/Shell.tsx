"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CompassIcon,
  HomeIcon,
  SearchIcon,
  SlidersIcon,
  StoreIcon,
} from "@/components/icons";
import { useAuth } from "@/lib/useAuth";

const tabs = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/discover", label: "Discover", icon: CompassIcon },
  { href: "/stores", label: "Stores", icon: StoreIcon },
  { href: "/settings", label: "Settings", icon: SlidersIcon },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loggedIn, user } = useAuth();
  const initial = (user?.email || "A").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-white/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 md:py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <img src="/icon.png" alt="" className="h-9 w-9 rounded-xl shadow-sm ring-1 ring-black/5" />
            <span className="font-display text-[1.15rem] font-semibold tracking-tight">Goluto</span>
          </Link>
          <nav className="hidden items-center gap-1 rounded-xl bg-paper p-1 md:flex">
            {tabs.map((tab) => {
              const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                    active
                      ? "bg-ink !text-white shadow-sm"
                      : "text-muted hover:bg-white hover:text-ink"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/search"
            className="ml-auto hidden min-w-0 flex-1 items-center gap-2 rounded-xl bg-paper px-4 py-2.5 text-sm text-muted transition hover:bg-line lg:flex lg:max-w-sm"
          >
            <SearchIcon size={16} />
            <span className="truncate">Search offers and stores</span>
          </Link>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Link
              href="/search"
              className="grid h-9 w-9 place-items-center rounded-xl bg-paper text-ink lg:hidden"
              aria-label="Search"
            >
              <SearchIcon size={16} />
            </Link>
            {loggedIn ? (
              <Link
                href="/settings"
                className="grid h-9 w-9 place-items-center rounded-xl bg-deal-soft text-sm font-bold text-deal-ink"
                aria-label="Account"
              >
                {initial}
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-deal-deep px-3.5 py-1.5 text-sm font-bold !text-white shadow-sm"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 md:pb-12">{children}</main>
      <nav className="fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-white/70 bg-white/90 shadow-lift backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-4 pb-[max(0.15rem,env(safe-area-inset-bottom))]">
          {tabs.map((tab) => {
            const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${
                  active ? "text-deal" : "text-muted"
                }`}
              >
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${active ? "bg-deal-soft" : ""}`}>
                  <Icon filled={active} size={20} />
                </span>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
