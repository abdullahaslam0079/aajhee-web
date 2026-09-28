"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthCard, MERCHANT_AUTH_BRANDING } from "@/components/AuthCard";
import { Button, ErrorBox, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import { setSession } from "@/lib/auth";
import { errorMessage } from "@/lib/errors";
import { useAuth } from "@/lib/useAuth";
import type { AuthPayload } from "@/lib/types";

export default function BusinessLoginPage() {
  const router = useRouter();
  const { ready, loggedIn, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (loggedIn && role === "business") {
      router.replace("/business");
    }
  }, [ready, loggedIn, role, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api<AuthPayload>("/api/business/auth/token", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!data.access) {
        throw new Error("Login response missing access token.");
      }
      setSession({
        access: data.access,
        refresh: data.refresh,
        user: data.business || data.user || { id: 0, email },
        role: "business",
      });
      router.replace("/business");
    } catch (err) {
      setError(errorMessage(err, "Invalid merchant email or password."));
    } finally {
      setLoading(false);
    }
  }

  if (!ready || (loggedIn && role === "business")) {
    return <div className="grid min-h-dvh place-items-center text-sm text-muted">Loading…</div>;
  }

  return (
    <AuthCard
      title="Merchant login"
      subtitle="Manage branches, listings, and orders for your store."
      {...MERCHANT_AUTH_BRANDING}
      footer={
        <>
          New partner? <Link href="/business/register" className="font-bold text-deal">Register</Link>
          <span className="mx-2">·</span>
          <Link href="/login" className="font-bold text-deal">Customer login</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        {error ? <ErrorBox message={error} /> : null}
        <Field label="Email">
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <div className="text-right">
          <Link href="/business/forgot-password" className="text-sm font-semibold text-deal">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Log in"}
        </Button>
      </form>
    </AuthCard>
  );
}
