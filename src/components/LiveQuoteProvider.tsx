"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { isMarketOpenIST } from "@/lib/market";
import type { LiveQuote } from "@/lib/useLiveQuote";

// Batched live quotes for list/grid pages: one provider polls every symbol it
// was seeded with (chunked ≤50 per request) and shares results via context, so
// a 100-row page makes ~2 requests/tick instead of 100.
type Ctx = Record<string, LiveQuote>;
const LiveCtx = createContext<Ctx | null>(null);

const POLL_MS = 15_000;
const CHUNK = 50;

export function LiveQuoteProvider({
  seed,
  children,
}: {
  seed: Record<string, LiveQuote>;
  children: React.ReactNode;
}) {
  // First render === server render (seed) → hydration-safe; effect updates later.
  const [quotes, setQuotes] = useState<Ctx>(seed);

  useEffect(() => {
    const syms = Object.keys(seed);
    if (!syms.length) return;
    let cancelled = false;

    const pull = async () => {
      const chunks: string[][] = [];
      for (let i = 0; i < syms.length; i += CHUNK) chunks.push(syms.slice(i, i + CHUNK));
      try {
        const parts = await Promise.all(
          chunks.map(async (c) => {
            const res = await fetch(
              `/api/quote?symbols=${c.map(encodeURIComponent).join(",")}`,
              { cache: "no-store" }
            );
            if (!res.ok) return {} as Ctx;
            const data = await res.json();
            return (data?.quotes ?? {}) as Ctx;
          })
        );
        if (cancelled) return;
        const merged = Object.assign({}, ...parts) as Ctx;
        if (Object.keys(merged).length) setQuotes((prev) => ({ ...prev, ...merged }));
      } catch {
        /* keep last values on transient failure */
      }
    };

    pull(); // immediate freshen on mount
    const id = setInterval(() => {
      if (isMarketOpenIST()) pull();
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [seed]);

  return <LiveCtx.Provider value={quotes}>{children}</LiveCtx.Provider>;
}

/** Read the live quote for one symbol; null if no provider or not seeded. */
export function useLive(symbol?: string | null): LiveQuote | null {
  const ctx = useContext(LiveCtx);
  if (!ctx || !symbol) return null;
  return ctx[symbol] ?? null;
}
