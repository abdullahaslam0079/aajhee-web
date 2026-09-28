"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard, MERCHANT_AUTH_BRANDING } from "@/components/AuthCard";
import { Button, ErrorBox, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import { compressImageFiles } from "@/lib/compressImage";
import { errorMessage } from "@/lib/errors";
import type { Category } from "@/lib/types";

export default function BusinessRegisterPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [cnicFile, setCnicFile] = useState<File | null>(null);
  const [shopPhotoFile, setShopPhotoFile] = useState<File | null>(null);
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
      if (!cnicFile && !shopPhotoFile) {
        throw new Error("Upload a CNIC or shop photo for verification.");
      }
      const data = new FormData();
      data.set("name", name);
      data.set("email", email);
      data.set("phone", phone);
      data.set("instagram_url", instagramUrl);
      data.set("password", password);
      data.set("password_confirm", passwordConfirm);
      data.set("category_id", String(categoryId));
      if (cnicFile) data.set("cnic_image", cnicFile);
      if (shopPhotoFile) data.set("shop_photo", shopPhotoFile);
      await api("/api/business/auth/register", {
        method: "POST",
        body: data,
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
      subtitle="Create a merchant account. Your shop stays hidden until an admin verifies you."
      {...MERCHANT_AUTH_BRANDING}
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
        <Field label="Main category">
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} required>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Phone number">
          <input
            className={inputClass}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03XXXXXXXXX"
            required
          />
        </Field>
        <Field label="Instagram link">
          <input
            className={inputClass}
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/yourshop"
            required
          />
        </Field>
        <Field label="CNIC photo" hint="Upload CNIC or shop photo (at least one required).">
          <input
            className={inputClass}
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const list = e.target.files;
              if (!list?.length) return;
              const compressed = await compressImageFiles(Array.from(list));
              setCnicFile(compressed[0] || null);
            }}
          />
        </Field>
        <Field label="Shop photo">
          <input
            className={inputClass}
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const list = e.target.files;
              if (!list?.length) return;
              const compressed = await compressImageFiles(Array.from(list));
              setShopPhotoFile(compressed[0] || null);
            }}
          />
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
