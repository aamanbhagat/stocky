// Shared Yahoo Finance client — cookie+crumb auth + batch quote refresh.
// Used by the weekly cron to keep prices/market caps live.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const Q1 = "https://query1.finance.yahoo.com";
const CR = 1e7;

const fin = (v?: number | null) => (v != null && isFinite(v) ? v : null);
const toCr = (v?: number | null) => (v != null && isFinite(v) ? v / CR : null);

export type QuoteUpdate = {
  currentPrice: number | null;
  dayChange: number | null;
  dayChangePct: number | null;
  marketCap: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  eps: number | null;
  bookValue: number | null;
  high52: number | null;
  low52: number | null;
  dividendYield: number | null;
};

export async function yahooAuth(): Promise<{ cookie: string; crumb: string }> {
  const c = await fetch("https://fc.yahoo.com", { headers: { "User-Agent": UA } });
  const cookie = (c.headers.get("set-cookie") || "")
    .split(",")
    .map((s) => s.split(";")[0])
    .filter(Boolean)
    .join("; ");
  const r = await fetch(`${Q1}/v1/test/getcrumb`, {
    headers: { "User-Agent": UA, Cookie: cookie },
  });
  const crumb = (await r.text()).trim();
  if (!crumb || crumb.length > 20) throw new Error(`Yahoo crumb failed: "${crumb}"`);
  return { cookie, crumb };
}

/** Fetch quotes for up to ~50 symbols; returns map keyed by yahoo symbol. */
export async function fetchQuotes(
  symbols: string[],
  auth: { cookie: string; crumb: string }
): Promise<Map<string, QuoteUpdate>> {
  const url = `${Q1}/v7/finance/quote?symbols=${symbols
    .map(encodeURIComponent)
    .join(",")}&crumb=${auth.crumb}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Cookie: auth.cookie } });
  if (!res.ok) throw new Error(`Yahoo quote ${res.status}`);
  const data = await res.json();
  const rows = data?.quoteResponse?.result ?? data?.quoteResults?.result ?? [];
  const out = new Map<string, QuoteUpdate>();
  for (const q of rows) {
    const divY =
      q.dividendYield != null
        ? q.dividendYield
        : q.trailingAnnualDividendYield != null
          ? q.trailingAnnualDividendYield * 100
          : null;
    out.set(q.symbol, {
      currentPrice: fin(q.regularMarketPrice),
      dayChange: fin(q.regularMarketChange),
      dayChangePct: fin(q.regularMarketChangePercent),
      marketCap: toCr(q.marketCap),
      peRatio: fin(q.trailingPE),
      pbRatio: fin(q.priceToBook),
      eps: fin(q.epsTrailingTwelveMonths),
      bookValue: fin(q.bookValue),
      high52: fin(q.fiftyTwoWeekHigh),
      low52: fin(q.fiftyTwoWeekLow),
      dividendYield: fin(divY),
    });
  }
  return out;
}
