import { NextResponse } from "next/server";
import { yahooAuth, fetchQuotes, type QuoteUpdate } from "@/lib/yahoo";

// Real-time quote proxy. Client price/metric components poll this during
// market hours; the daily cron remains the durable DB-backed fallback.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Yahoo cookie+crumb is expensive (2 round-trips); cache it in module memory.
let cachedAuth: { auth: { cookie: string; crumb: string }; at: number } | null = null;
const AUTH_TTL = 30 * 60_000;

async function getAuth(force = false) {
  if (!force && cachedAuth && Date.now() - cachedAuth.at < AUTH_TTL) return cachedAuth.auth;
  const auth = await yahooAuth();
  cachedAuth = { auth, at: Date.now() };
  return auth;
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("symbols");
  if (!raw) {
    return NextResponse.json({ ok: false, error: "symbols required" }, { status: 400 });
  }
  const symbols = [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 50);
  if (!symbols.length) {
    return NextResponse.json({ ok: false, error: "no valid symbols" }, { status: 400 });
  }

  try {
    let map: Map<string, QuoteUpdate>;
    try {
      map = await fetchQuotes(symbols, await getAuth());
    } catch {
      // Crumb may have expired — refresh auth once and retry.
      map = await fetchQuotes(symbols, await getAuth(true));
    }

    const quotes: Record<string, QuoteUpdate> = {};
    for (const [sym, q] of map) quotes[sym] = q;

    return NextResponse.json(
      { ok: true, quotes, at: Date.now() },
      { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } }
    );
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
