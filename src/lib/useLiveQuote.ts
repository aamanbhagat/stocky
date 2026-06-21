"use client";

import { useEffect, useState } from "react";
import { isMarketOpenIST } from "@/lib/market";
import type { QuoteUpdate } from "@/lib/yahoo";

export type LiveQuote = QuoteUpdate;
export type LiveState = { q: LiveQuote; at: number | null; live: boolean };

const POLL_MS = 15_000;

// One registry entry per symbol so multiple components on a page (hero price +
// metrics grid) share a single in-flight fetch + interval instead of doubling
// requests against Yahoo.
type Reg = {
  state: LiveState | null;
  subs: Set<(s: LiveState) => void>;
  timer: ReturnType<typeof setInterval> | null;
};
const reg = new Map<string, Reg>();

async function pull(symbol: string) {
  const r = reg.get(symbol);
  if (!r) return;
  try {
    const res = await fetch(`/api/quote?symbols=${encodeURIComponent(symbol)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await res.json();
    const q: LiveQuote | undefined = data?.quotes?.[symbol];
    if (!q || q.currentPrice == null) return;
    const next: LiveState = { q, at: data.at ?? Date.now(), live: true };
    r.state = next;
    r.subs.forEach((fn) => fn(next));
  } catch {
    /* keep last value on transient failure */
  }
}

/** Hydrate a seeded quote with live polling while the market is open. */
export function useLiveQuote(symbol: string | null | undefined, seed: LiveQuote): LiveState {
  const [state, setState] = useState<LiveState>({ q: seed, at: null, live: false });

  useEffect(() => {
    if (!symbol) return;
    let r = reg.get(symbol);
    if (!r) {
      r = { state: null, subs: new Set(), timer: null };
      reg.set(symbol, r);
    }
    const cb = (s: LiveState) => setState(s);
    r.subs.add(cb);
    // Deliver an already-cached value after commit (not synchronously in the
    // effect) so first render still matches the server-rendered seed.
    if (r.state) {
      const cached = r.state;
      queueMicrotask(() => cb(cached));
    }

    pull(symbol); // immediate freshen on mount (also catches after-hours close)
    if (!r.timer) {
      r.timer = setInterval(() => {
        if (isMarketOpenIST()) pull(symbol);
      }, POLL_MS);
    }

    return () => {
      const cur = reg.get(symbol);
      if (!cur) return;
      cur.subs.delete(cb);
      if (cur.subs.size === 0 && cur.timer) {
        clearInterval(cur.timer);
        cur.timer = null;
      }
    };
  }, [symbol]);

  return state;
}
