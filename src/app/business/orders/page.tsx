"use client";

import { Suspense } from "react";
import BusinessOrdersPage from "./OrdersClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">Loading orders…</div>}>
      <BusinessOrdersPage />
    </Suspense>
  );
}
