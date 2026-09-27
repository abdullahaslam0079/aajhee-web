"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthCard } from "@/components/AuthCard";
import { Button, ErrorBox, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/api/auth/password/reset", {
        method: "POST",
        body: JSON.stringify({
          token,
          password,
          password_confirm: passwordConfirm,
        }),
      });
      router.replace("/business/login");
    } catch (err) {
      setError(errorMessage(err, "Could not reset password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Paste the token from your email if the link didn't fill it in."
      footer={
        <>
          <Link href="/business/login" className="font-bold text-deal">
            Back to login
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        {error ? <ErrorBox message={error} /> : null}
        <Field label="Reset token">
          <input
            className={inputClass}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </Field>
        <Field label="New password">
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Field label="Confirm password">
          <input
            className={inputClass}
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function BusinessResetPasswordPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-sm text-muted">Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
