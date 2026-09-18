"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorBox, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import { getAccessToken, setSession } from "@/lib/auth";
import { errorMessage } from "@/lib/errors";
import { useAuth } from "@/lib/useAuth";
import type { User } from "@/lib/types";

export default function EditProfilePage() {
  const { loggedIn, user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(" "));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loggedIn) router.replace("/login");
  }, [loggedIn, router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = await api<User & { message?: string }>("/api/user/profile", {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ name }),
      });
      if (user) {
        setSession({
          access: getAccessToken() || "",
          user: { ...user, ...data, name },
          role: "consumer",
        });
      }
      router.push("/settings");
    } catch (err) {
      setError(errorMessage(err, "Could not update profile."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-xl space-y-4 rounded-2xl bg-white p-5 shadow-card outline outline-1 outline-black/5">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Edit profile</h1>
      {error ? <ErrorBox message={error} /> : null}
      <Field label="Name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      {user?.phone ? (
        <Field label="Phone">
          <input className={inputClass} value={user.phone} disabled />
        </Field>
      ) : (
        <Field label="Email">
          <input
            className={inputClass}
            value={user?.email?.includes(".aajhee.local") ? "" : user?.email || ""}
            disabled
          />
        </Field>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
