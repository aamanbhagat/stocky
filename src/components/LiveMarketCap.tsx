"use client";

import { crFromCr } from "@/lib/format";
import { useLiveQuote, type LiveQuote } from "@/lib/useLiveQuote";

// Hero market-cap figure, live-polled. Rendered inside <MarketPulse> which
// supplies the open/closed pulse animation.
export function LiveMarketCap({
  symbol,
  seed,
}: {
  symbol?: string | null;
  seed: LiveQuote;
}) {
  const { q } = useLiveQuote(symbol, seed);
  return (
    <span className="font-display tnum text-[40px] leading-none text-ink">
      {q.marketCap != null ? crFromCr(q.marketCap) : "—"}
    </span>
  );
}
