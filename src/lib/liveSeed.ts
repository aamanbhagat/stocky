import type { QuoteUpdate } from "@/lib/yahoo";

// Cap how many symbols a page subscribes to live, so long lists (e.g. a
// 500-row sector page) don't fan out into dozens of polls. Rows beyond this
// keep their DB snapshot.
export const MAX_LIVE = 100;

const EMPTY: QuoteUpdate = {
  currentPrice: null,
  dayChange: null,
  dayChangePct: null,
  marketCap: null,
  peRatio: null,
  pbRatio: null,
  eps: null,
  bookValue: null,
  high52: null,
  low52: null,
  dividendYield: null,
};

type SeedRow = {
  yahooSymbol: string | null;
  marketCap?: number | null;
  currentPrice?: number | null;
  dayChangePct?: number | null;
};

/** Build the symbol→quote seed map a LiveQuoteProvider hydrates from. */
export function seedQuotes(rows: SeedRow[]): Record<string, QuoteUpdate> {
  const out: Record<string, QuoteUpdate> = {};
  for (const r of rows.slice(0, MAX_LIVE)) {
    if (!r.yahooSymbol || out[r.yahooSymbol]) continue;
    out[r.yahooSymbol] = {
      ...EMPTY,
      marketCap: r.marketCap ?? null,
      currentPrice: r.currentPrice ?? null,
      dayChangePct: r.dayChangePct ?? null,
    };
  }
  return out;
}
