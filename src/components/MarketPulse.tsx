"use client";

import { useEffect, useState } from "react";

function isMarketOpenIST(now: Date = new Date()): boolean {
  // Compute current IST hour/min from UTC
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  const ist = new Date(utc + 5.5 * 3600_000);
  const day = ist.getUTCDay(); // 0 Sun .. 6 Sat
  if (day === 0 || day === 6) return false;
  const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30;
}

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
