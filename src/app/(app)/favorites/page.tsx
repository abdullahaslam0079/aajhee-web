"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StoreCard } from "@/components/StoreCard";
import { Empty, ErrorBox } from "@/components/ui";
import { api, pageResults } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useAuth } from "@/lib/useAuth";
import type { MapBranch, Paginated } from "@/lib/types";

export default function FavoritesPage() {
  const { loggedIn } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<MapBranch[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loggedIn) {
      router.replace("/login");
      return;
    }
    api<Paginated<MapBranch>>("/api/user/favorites", { auth: true })
      .then((data) => setBranches(pageResults(data)))
      .catch((err) => setError(errorMessage(err)));
  }, [loggedIn, router]);

  if (!loggedIn) return null;

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-semibold tracking-tight">Favorites</h1>
      {error ? <ErrorBox message={error} /> : null}
      {branches.length === 0 && !error ? (
        <Empty title="No saved stores" body="Save a store from its page to see it here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {branches.map((branch) => (
            <StoreCard key={branch.id} branch={branch} />
          ))}
        </div>
      )}
      <p className="mt-4 text-sm text-muted">
        Looking for home deals? <Link href="/" className="font-semibold text-deal">Back to offers</Link>
      </p>
    </div>
  );
}
