"use client";

import { useEffect, useState } from "react";
import { Empty, ErrorBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { Branch } from "@/lib/types";

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState("");

  function load() {
    return api<Branch[]>("/api/business/branches", { auth: true })
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch((err) => setError(errorMessage(err)));
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: number) {
    if (!confirm("Delete this branch?")) return;
    try {
      await api(`/api/business/branches/${id}`, { method: "DELETE", auth: true });
      load();
    } catch (err) {
      setError(errorMessage(err, "Could not delete branch."));
    }
  }

  return (
    <div>
      <PageHeader title="Branches" action={{ href: "/business/branches/new", label: "Add branch" }} />
      {error ? <ErrorBox message={error} /> : null}
      {branches.length === 0 && !error ? (
        <Empty title="No branches" body="Add a store location so in-store offers can be assigned." />
      ) : (
        <div className="grid gap-3">
          {branches.map((branch) => (
            <article key={branch.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-card outline outline-1 outline-black/5">
              <div>
                <p className="font-bold">{branch.name}</p>
                <p className="text-sm text-muted">
                  {branch.street} {branch.house_number}, {branch.postal_code} {branch.city}
                </p>
              </div>
              <button type="button" className="text-sm font-semibold text-red-600" onClick={() => remove(branch.id)}>
                Delete
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
