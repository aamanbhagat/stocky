"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";

type Result = {
  slug: string;
  symbol: string;
  name: string;
  sector: string | null;
  exchange: string;
  marketCap: number | null;
  currentPrice: number | null;
  dayChangePct: number | null;
};

function crShort(cr?: number | null) {
  if (cr == null) return "—";
  if (cr >= 1e5) return `₹${(cr / 1e5).toFixed(2)}L Cr`;
  if (cr >= 100) return `₹${cr.toFixed(0)} Cr`;
  return `₹${cr.toFixed(1)} Cr`;
}

export function LiveSearch({ size = "lg" }: { size?: "lg" | "sm" }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const seq = useRef(0);

  const run = useCallback(async (term: string) => {
    const id = ++seq.current;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (id === seq.current) {
        setResults(data.results ?? []);
        setOpen(true);
        setActive(-1);
      }
    } catch {
      /* aborted */
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, []);

  // Debounce
  useEffect(() => {
    if (q.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(() => run(q.trim()), 130);
    return () => clearTimeout(t);
  }, [q, run]);

  // Click-outside close
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(r: Result) {
    setOpen(false);
    router.push(`/companies/${r.slug}`);
  }

  function onKey(e: React.KeyboardEvent) {
    if (!open || results.length === 0) {
      if (e.key === "Enter" && q.trim()) router.push(`/companies?q=${encodeURIComponent(q.trim())}`);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && results[active]) go(results[active]);
      else if (q.trim()) router.push(`/companies?q=${encodeURIComponent(q.trim())}`);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const lg = size === "lg";

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="block">
        {lg && <span className="eyebrow block mb-2">Search 5,010 listed companies</span>}
        <div
          className={`flex items-stretch border-2 border-ink bg-paper-warm ${
            lg ? "h-14" : "h-11"
          } ${open && results.length ? "shadow-[6px_6px_0_0_var(--color-ink)]" : ""} transition-shadow`}
        >
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => q.trim() && results.length && setOpen(true)}
            placeholder={lg ? "RELIANCE, TCS, HDFC Bank, Infosys…" : "Search symbol or company…"}
            className={`flex-1 px-4 bg-transparent outline-none placeholder:text-mute-2 placeholder:font-medium ${
              lg ? "text-[18px]" : "text-[15px]"
            } font-mono font-semibold`}
            aria-label="Search companies"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls="search-results"
          />
          <button
            type="button"
            onClick={() => q.trim() && router.push(`/companies?q=${encodeURIComponent(q.trim())}`)}
            className={`px-5 bg-ink text-paper hover:bg-saffron hover:text-ink transition-colors font-mono font-semibold ${
              lg ? "text-[13px]" : "text-[12px]"
            } tracking-widest uppercase`}
          >
            {loading ? "…" : "Search"}
          </button>
        </div>
      </div>

      {open && results.length > 0 && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 bg-paper-warm border-2 border-ink shadow-[6px_6px_0_0_var(--color-ink)] max-h-[420px] overflow-auto"
        >
          {results.map((r, i) => {
            const up = (r.dayChangePct ?? 0) >= 0;
            return (
              <li key={r.slug} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 border-b border-rule last:border-0 ${
                    i === active ? "bg-saffron/15" : ""
                  }`}
                >
                  <span className="font-mono font-semibold text-[12px] text-ink-2 w-24 shrink-0 truncate">
                    {r.symbol}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-display text-[16px] text-ink truncate leading-tight">
                      {r.name}
                    </span>
                    <span className="block text-[11px] text-mute-2 truncate">
                      {r.exchange} · {r.sector ?? "—"}
                    </span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block font-mono font-semibold text-[12px] text-ink tnum">
                      {crShort(r.marketCap)}
                    </span>
                    {r.dayChangePct != null && (
                      <span
                        className="block font-mono text-[11px] tnum"
                        style={{ color: up ? "var(--color-bull)" : "var(--color-bear)" }}
                      >
                        {up ? "▲" : "▼"} {Math.abs(r.dayChangePct).toFixed(2)}%
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
          <li className="px-4 py-2 bg-ink/[0.03]">
            <button
              type="button"
              onClick={() => router.push(`/companies?q=${encodeURIComponent(q.trim())}`)}
              className="font-mono text-[11px] tracking-widest uppercase text-mute hover:text-saffron-dim"
            >
              See all results for “{q.trim()}” →
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
