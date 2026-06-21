"use client";

import { crFromCr } from "@/lib/format";
import { useLive } from "@/components/LiveQuoteProvider";

// Inline live market-cap value. Falls back to the seeded DB snapshot when no
// LiveQuoteProvider is present (e.g. cards rendered outside a list page).
export function LiveCap({
  symbol,
  seed,
}: {
  symbol?: string | null;
  seed?: number | null;
}) {
  const q = useLive(symbol);
  const cap = q?.marketCap ?? seed ?? null;
  return <>{cap != null ? crFromCr(cap) : "—"}</>;
}
