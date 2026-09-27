"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConfirmDialog, Empty, ErrorBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { Branch } from "@/lib/types";

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  function load() {
    return api<Branch[]>("/api/business/branches", { auth: true })
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch((err) => setError(errorMessage(err)));
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: number) {
    try {
      await api(`/api/business/branches/${id}`, { method: "DELETE", auth: true });
      setDeleteId(null);
      load();
    } catch (err) {
      setError(errorMessage(err, "Could not delete branch."));
      setDeleteId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Branches"
        subtitle="Locations, contacts, delivery, and payment settings"
        action={{ href: "/business/branches/new", label: "Add branch" }}
      />
      {error ? <ErrorBox message={error} /> : null}
      {branches.length === 0 && !error ? (
        <Empty title="No branches" body="Add a store location so customers can order from you." />
      ) : (
        <div className="grid gap-3">
          {branches.map((branch) => (
            <article
              key={branch.id}
              className="card flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <Link href={`/business/branches/${branch.id}`} className="font-bold hover:text-deal">
                  {branch.name}
                </Link>
                <p className="text-sm text-muted">
                  {branch.formattedAddress ||
                    branch.formatted_address ||
                    `${branch.street} ${branch.house_number}, ${branch.postal_code} ${branch.city}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/business/branches/${branch.id}`}
                  className="text-sm font-semibold text-deal"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="text-sm font-semibold text-red-600"
                  onClick={() => setDeleteId(branch.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {deleteId != null ? (
        <ConfirmDialog
          title="Delete branch?"
          message="This removes the branch and its commerce settings."
          confirmLabel="Delete"
          cancelLabel="Keep"
          danger
          onCancel={() => setDeleteId(null)}
          onConfirm={() => void remove(deleteId)}
        />
      ) : null}
    </div>
  );
}
