"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronIcon } from "@/components/icons";
import { cardClass } from "@/components/ui";
import { clearSession } from "@/lib/auth";
import { signOutFirebase } from "@/lib/firebaseAuth";
import { displayName } from "@/lib/format";
import { useAuth } from "@/lib/useAuth";
import { useLocation } from "@/lib/useLocation";

function Row({ href, children, danger }: { href?: string; children: React.ReactNode; danger?: boolean }) {
  const className = `flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left font-semibold ${
    danger ? "text-red-600" : ""
  }`;
  if (href) {
    return (
      <Link href={href} className={className}>
        <span>{children}</span>
        <ChevronIcon className="text-muted" />
      </Link>
    );
  }
  return (
    <span className={className}>
      <span>{children}</span>
    </span>
  );
}

export default function SettingsPage() {
  const { loggedIn, user, role } = useAuth();
  const loc = useLocation();
  const router = useRouter();
  const name = loggedIn ? displayName(user) : "Guest";
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 font-display text-2xl font-semibold tracking-tight">Profile</h1>
      <div className={`${cardClass} flex items-center gap-4 p-5`}>
        <div className="grid h-14 w-14 place-items-center rounded-xl bg-deal-soft text-xl font-extrabold text-deal-ink">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xl font-extrabold">{name}</p>
          <p className="truncate text-sm text-muted">
            {user?.phone || (user?.email && !user.email.includes(".aajhee.local") ? user.email : "Browse deals without an account")}
          </p>
          <p className="mt-1 text-sm text-muted">{loc.label || "Berlin"}</p>
        </div>
      </div>

      <h2 className="mb-2 mt-7 text-xs font-bold uppercase tracking-[0.14em] text-muted">Account</h2>
      <div className={`${cardClass} divide-y divide-line overflow-hidden`}>
        {loggedIn ? (
          <>
            <Row href="/settings/profile">Edit profile</Row>
            <Row href="/settings/addresses">Addresses</Row>
            <Row href="/favorites">Favorites</Row>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left font-semibold text-red-600"
              onClick={async () => {
                await signOutFirebase();
                clearSession();
                router.push("/");
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Row href="/login">Log in</Row>
          </>
        )}
      </div>

      <h2 className="mb-2 mt-7 text-xs font-bold uppercase tracking-[0.14em] text-muted">Partners</h2>
      <div className={`${cardClass} overflow-hidden`}>
        <Row href="/business/login">
          {role === "business" ? "Open business dashboard" : "Merchant login"}
        </Row>
      </div>
    </div>
  );
}
