"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { Button, ErrorBox, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { Category } from "@/lib/types";

export default function BusinessRegisterPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<Category[] | { results: Category[] }>("/api/categories")
      .then((data) => {
        const list = Array.isArray(data) ? data : data.results || [];
        setCategories(list);
        if (list[0]) setCategoryId(list[0].id);
      })
      .catch(() => setCategories([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/api/business/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirm: passwordConfirm,
          category_id: categoryId,
        }),
      });
      router.replace("/business/login");
    } catch (err) {
      setError(errorMessage(err, "Could not create the merchant account."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Register your business"
      subtitle="Create a merchant account, then add branches and offers."
      footer={
        <>
          Already a partner? <Link href="/business/login" className="font-bold text-deal">Log in</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        {error ? <ErrorBox message={error} /> : null}
        <Field label="Business name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Category">
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} required>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Email">
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Field label="Confirm password">
          <input className={inputClass} type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating…" : "Create merchant account"}
        </Button>
      </form>
    </AuthCard>
  );
}
