"use client";

import { MetricCell } from "@/components/MetricCell";
import { crFromCr, inr, num, signedPct } from "@/lib/format";
import { useLiveQuote, type LiveQuote } from "@/lib/useLiveQuote";

// Key-metrics grid (section 01) hydrated with live Yahoo data. Seeded from the
// DB snapshot so it renders identically on the server, then ticks live.
export function LiveMetrics({
  symbol,
  seed,
}: {
  symbol?: string | null;
  seed: LiveQuote;
}) {
  const { q } = useLiveQuote(symbol, seed);
  return (
    <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <MetricCell label="Market cap" value={q.marketCap != null ? crFromCr(q.marketCap) : "—"} accent />
      <MetricCell
        label="Current price"
        value={q.currentPrice != null ? inr(q.currentPrice) : "—"}
        hint={q.dayChangePct != null ? signedPct(q.dayChangePct) + " today" : undefined}
      />
      <MetricCell label="52W high" value={q.high52 != null ? inr(q.high52) : "—"} />
      <MetricCell label="52W low" value={q.low52 != null ? inr(q.low52) : "—"} />
      <MetricCell label="Stock P/E" value={num(q.peRatio)} />
      <MetricCell label="P/B ratio" value={num(q.pbRatio)} />
    </div>
  );
}
