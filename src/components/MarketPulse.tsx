"use client";

import { useEffect, useState } from "react";
import { isMarketOpenIST } from "@/lib/market";

/**
 * Signature element: the market-cap figure breathes when NSE/BSE are open.
 */
export function MarketPulse({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const tick = () => setOpen(isMarketOpenIST());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={`relative inline-flex items-center ${open ? "market-pulse" : ""}`}>
      {children}
      <span
        className="ml-3 font-mono text-[10px] tracking-widest uppercase"
        style={{ color: open ? "var(--color-saffron-dim)" : "var(--color-mute-2)" }}
      >
        ● {open ? "Live" : "Closed"}
      </span>
    </span>
  );
}
