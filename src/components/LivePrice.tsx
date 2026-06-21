"use client";

import { useEffect, useRef, useState } from "react";
import { inr, signedPct } from "@/lib/format";
import { useLiveQuote, type LiveQuote } from "@/lib/useLiveQuote";

// Live replacement for the hero PriceBadge. Server-renders the seeded value
// (good for SEO + first paint), then polls /api/quote during market hours.
export function LivePrice({
  symbol,
  seed,
}: {
  symbol?: string | null;
  seed: LiveQuote;
}) {
  const { q, at, live } = useLiveQuote(symbol, seed);
  const price = q.currentPrice;
  const changePct = q.dayChangePct;

  // Brief flash whenever the price ticks.
  const prev = useRef<number | null>(price);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    if (price == null || prev.current == null) {
      prev.current = price;
      return;
    }
    if (price !== prev.current) {
      setFlash(price > prev.current ? "up" : "down");
      const id = setTimeout(() => setFlash(null), 700);
      prev.current = price;
      return () => clearTimeout(id);
    }
  }, [price]);

  if (price == null) return null;
  const up = (changePct ?? 0) >= 0;
  const color = up ? "var(--color-bull)" : "var(--color-bear)";
  const flashColor =
    flash === "up" ? "var(--color-bull)" : flash === "down" ? "var(--color-bear)" : "transparent";

  return (
    <span className="inline-flex flex-col gap-1">
      <span className="inline-flex items-baseline gap-2">
        <span
          className="font-mono font-semibold tnum text-[22px] text-ink rounded px-1 -mx-1 transition-colors duration-700"
          style={{ backgroundColor: flash ? flashColor + "22" : "transparent" }}
        >
          {inr(price)}
        </span>
        {changePct != null && (
          <span className="font-mono font-semibold tnum text-[14px]" style={{ color }}>
            {up ? "▲" : "▼"} {signedPct(changePct)}
          </span>
        )}
      </span>
      {at != null && (
        <span className="font-mono text-[10px] tracking-widest uppercase text-mute-2">
          <span style={{ color: live ? "var(--color-saffron-dim)" : undefined }}>●</span>{" "}
          {live ? "Live" : "Last"} ·{" "}
          {new Date(at).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      )}
    </span>
  );
}
