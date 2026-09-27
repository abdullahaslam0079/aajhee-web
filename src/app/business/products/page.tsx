"use client";

import { Suspense } from "react";
import ProductsClient from "./ProductsClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">Loading listings…</div>}>
      <ProductsClient />
    </Suspense>
  );
}
