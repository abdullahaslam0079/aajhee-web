"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Empty,
  ErrorBox,
  PageHeader,
  Skeleton,
  inputClass,
} from "@/components/ui";
import { api, pageResults } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/commerce";
import type { Paginated, ProductReview } from "@/lib/types";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${rating} stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < rating ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

export default function BusinessReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [flagDrafts, setFlagDrafts] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    api<Paginated<ProductReview> | ProductReview[]>("/api/business/reviews", {
      auth: true,
      query: {
        status: status || undefined,
        page_size: 50,
      },
    })
      .then((res) => {
        setReviews(pageResults(res));
        setError("");
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function reply(reviewId: number) {
    const text = (replyDrafts[reviewId] || "").trim();
    if (!text) return;
    setBusyId(reviewId);
    try {
      await api(`/api/business/reviews/${reviewId}/reply`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ reply: text }),
      });
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function flag(reviewId: number) {
    setBusyId(reviewId);
    try {
      await api(`/api/business/reviews/${reviewId}/flag`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ reason: (flagDrafts[reviewId] || "").trim() }),
      });
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        subtitle="Customer ratings on your products. Reply or flag abusive reviews for admin review."
      />

      <div className="flex flex-wrap gap-2">
        {[
          { value: "", label: "All" },
          { value: "published", label: "Published" },
          { value: "flagged", label: "Flagged" },
          { value: "hidden", label: "Hidden" },
        ].map((opt) => (
          <button
            key={opt.value || "all"}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              status === opt.value
                ? "bg-ink text-white"
                : "bg-white text-muted outline outline-1 outline-black/5"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error ? <ErrorBox message={error} /> : null}
      {loading ? <Skeleton className="h-48" /> : null}

      {!loading && reviews.length === 0 ? (
        <Empty
          title="No reviews yet"
          body="When customers rate delivered orders, they will show up here."
        />
      ) : null}

      <div className="grid gap-3">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-2xl bg-white p-4 shadow-card outline outline-1 outline-black/5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{review.product_name}</p>
                <p className="text-xs text-muted">
                  {review.user_display_name} · {formatDateTime(review.created_at)}
                  {review.branch_name ? ` · ${review.branch_name}` : ""}
                </p>
                <div className="mt-1">
                  <Stars rating={review.rating} />
                </div>
              </div>
              <Badge
                tone={
                  review.status === "flagged"
                    ? "warning"
                    : review.status === "hidden"
                      ? "danger"
                      : "success"
                }
              >
                {review.status}
              </Badge>
            </div>

            {review.comment ? (
              <p className="mt-3 text-sm text-ink/90">{review.comment}</p>
            ) : null}

            {review.images?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {review.images.map((img) =>
                  img.image_url ? (
                    <img
                      key={img.id}
                      src={img.image_url}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : null,
                )}
              </div>
            ) : null}

            {review.merchant_reply ? (
              <p className="mt-3 rounded-xl bg-paper px-3 py-2 text-sm text-muted">
                Your reply: {review.merchant_reply}
              </p>
            ) : null}

            {review.order_public_id ? (
              <Link
                href={`/business/orders/${review.order_public_id}`}
                className="mt-2 inline-block text-xs font-bold text-deal"
              >
                View order
              </Link>
            ) : null}

            {review.status !== "hidden" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <textarea
                    className={inputClass}
                    rows={2}
                    placeholder="Write a reply…"
                    value={replyDrafts[review.id] ?? review.merchant_reply ?? ""}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({
                        ...prev,
                        [review.id]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    disabled={busyId === review.id}
                    onClick={() => reply(review.id)}
                  >
                    {review.merchant_reply ? "Update reply" : "Reply"}
                  </Button>
                </div>
                {review.status !== "flagged" ? (
                  <div className="grid gap-2">
                    <textarea
                      className={inputClass}
                      rows={2}
                      placeholder="Flag reason (optional)"
                      value={flagDrafts[review.id] ?? ""}
                      onChange={(e) =>
                        setFlagDrafts((prev) => ({
                          ...prev,
                          [review.id]: e.target.value,
                        }))
                      }
                    />
                    <Button
                      variant="ghost"
                      disabled={busyId === review.id}
                      onClick={() => flag(review.id)}
                    >
                      Flag for admin
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
