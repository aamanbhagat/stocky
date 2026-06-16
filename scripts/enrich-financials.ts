/**
 * Scrape live financials from Yahoo Finance and enrich every company.
 *
 * Phase A — batch quote (fast, all companies):
 *   price, day change %, market cap, P/E, P/B, EPS, 52w hi/lo, book value, div yield.
 * Phase B — detailed quoteSummary (top N by market cap):
 *   ROE, ROA, debt/equity, current ratio, revenue, ebitda, net profit, margins,
 *   growth, beta, payout, analyst target + rating, employees, business summary,
 *   accurate sector/industry/website/HQ.
 *
 * Run: pnpm enrich:fin            (detailed for top 1500)
 *      DETAIL_TOP=5010 pnpm enrich:fin   (detailed for all — slow)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const Q1 = "https://query1.finance.yahoo.com";
const Q2 = "https://query2.finance.yahoo.com";

const DETAIL_TOP = parseInt(process.env.DETAIL_TOP ?? "1500", 10);
const CR = 1e7;

let COOKIE = "";
let CRUMB = "";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const toCr = (v?: number | null) => (v != null && isFinite(v) ? v / CR : null);
const pctOf = (v?: number | null) => (v != null && isFinite(v) ? v * 100 : null);
const fin = (v?: number | null) => (v != null && isFinite(v) ? v : null);

async function auth() {
  // 1) get cookie
  const c = await fetch("https://fc.yahoo.com", { headers: { "User-Agent": UA } });
  COOKIE = (c.headers.get("set-cookie") || "")
    .split(",")
    .map((s) => s.split(";")[0])
    .filter(Boolean)
    .join("; ");
  // 2) get crumb
  const r = await fetch(`${Q1}/v1/test/getcrumb`, {
    headers: { "User-Agent": UA, Cookie: COOKIE },
  });
  CRUMB = (await r.text()).trim();
  if (!CRUMB || CRUMB.length > 20) throw new Error(`Bad crumb: "${CRUMB}"`);
  console.log(`  auth ok · crumb=${CRUMB}`);
}

async function yget(url: string): Promise<any> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Cookie: COOKIE } });
    if (res.status === 401 || res.status === 403) {
      await auth();
      continue;
    }
    if (res.status === 429) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${url.slice(0, 80)}`);
    return res.json();
  }
  throw new Error(`giving up: ${url.slice(0, 80)}`);
}

// ---------- Phase A ----------
async function phaseA() {
  const all = await prisma.company.findMany({
    where: { yahooSymbol: { not: null } },
    select: { id: true, yahooSymbol: true },
  });
  console.log(`→ Phase A: batch quote for ${all.length} symbols`);

  const bySym = new Map<string, number>();
  for (const c of all) bySym.set(c.yahooSymbol!, c.id);

  const symbols = [...bySym.keys()];
  const BATCH = 50;
  let ok = 0;
  let miss = 0;

  for (let i = 0; i < symbols.length; i += BATCH) {
    const slice = symbols.slice(i, i + BATCH);
    const url = `${Q1}/v7/finance/quote?symbols=${slice.map(encodeURIComponent).join(",")}&crumb=${CRUMB}`;
    let data: any;
    try {
      data = await yget(url);
    } catch (e) {
      console.warn(`\n  batch ${i} failed: ${(e as Error).message}`);
      continue;
    }
    const results =
      data?.quoteResponse?.result ?? data?.quoteResults?.result ?? [];

    const updates: Promise<unknown>[] = [];
    for (const q of results) {
      const id = bySym.get(q.symbol);
      if (!id) continue;
      const divY =
        q.dividendYield != null
          ? q.dividendYield
          : q.trailingAnnualDividendYield != null
            ? q.trailingAnnualDividendYield * 100
            : null;
      updates.push(
        prisma.company.update({
          where: { id },
          data: {
            currentPrice: fin(q.regularMarketPrice),
            dayChange: fin(q.regularMarketChange),
            dayChangePct: fin(q.regularMarketChangePercent),
            marketCap: toCr(q.marketCap) ?? undefined,
            peRatio: fin(q.trailingPE),
            pbRatio: fin(q.priceToBook),
            eps: fin(q.epsTrailingTwelveMonths),
            bookValue: fin(q.bookValue),
            high52: fin(q.fiftyTwoWeekHigh),
            low52: fin(q.fiftyTwoWeekLow),
            dividendYield: fin(divY),
            pricedAt: new Date(),
          },
        }).then(() => { ok++; }).catch(() => { miss++; })
      );
    }
    await Promise.all(updates);
    process.stdout.write(`\r  ${Math.min(i + BATCH, symbols.length)}/${symbols.length}  ok=${ok} miss=${miss}`);
    await sleep(120);
  }
  console.log(`\n  Phase A done. ok=${ok} miss=${miss}`);
  return ok;
}

// ---------- Phase B ----------
const MODULES =
  "summaryDetail,defaultKeyStatistics,financialData,summaryProfile";

async function phaseB() {
  const top = await prisma.company.findMany({
    where: { yahooSymbol: { not: null }, marketCap: { not: null } },
    orderBy: { marketCap: "desc" },
    take: DETAIL_TOP,
    select: { id: true, yahooSymbol: true },
  });
  console.log(`→ Phase B: detailed financials for top ${top.length}`);

  let ok = 0;
  let miss = 0;

  for (let i = 0; i < top.length; i++) {
    const c = top[i];
    const url = `${Q2}/v10/finance/quoteSummary/${encodeURIComponent(c.yahooSymbol!)}?modules=${MODULES}&crumb=${CRUMB}`;
    try {
      const data = await yget(url);
      const r = data?.quoteSummary?.result?.[0];
      if (!r) { miss++; continue; }
      const sd = r.summaryDetail ?? {};
      const ks = r.defaultKeyStatistics ?? {};
      const fd = r.financialData ?? {};
      const sp = r.summaryProfile ?? {};

      const raw = (x: any) => (x && typeof x === "object" && "raw" in x ? x.raw : x);
      const revenue = raw(fd.totalRevenue);
      const pmargin = raw(fd.profitMargins);
      const netProfit =
        revenue != null && pmargin != null ? revenue * pmargin : null;
      const hq = [sp.city, sp.country].filter(Boolean).join(", ") || null;

      await prisma.company.update({
        where: { id: c.id },
        data: {
          roe: pctOf(raw(fd.returnOnEquity)),
          roa: pctOf(raw(fd.returnOnAssets)),
          debtToEquity:
            raw(fd.debtToEquity) != null ? raw(fd.debtToEquity) / 100 : null,
          currentRatio: fin(raw(fd.currentRatio)),
          revenue: toCr(revenue),
          ebitda: toCr(raw(fd.ebitda)),
          netProfit: toCr(netProfit),
          totalDebt: toCr(raw(fd.totalDebt)),
          totalCash: toCr(raw(fd.totalCash)),
          revenueGrowth: pctOf(raw(fd.revenueGrowth)),
          earningsGrowth: pctOf(raw(fd.earningsGrowth)),
          profitMargin: pctOf(pmargin),
          operatingMargin: pctOf(raw(fd.operatingMargins)),
          dividendRate: fin(raw(sd.dividendRate)),
          payoutRatio: pctOf(raw(sd.payoutRatio)),
          beta: fin(raw(sd.beta)),
          targetPrice: fin(raw(fd.targetMeanPrice)),
          recommendation: fd.recommendationKey || null,
          analystCount:
            raw(fd.numberOfAnalystOpinions) != null
              ? Math.round(raw(fd.numberOfAnalystOpinions))
              : null,
          sharesOutstanding: fin(raw(ks.sharesOutstanding)),
          employees: sp.fullTimeEmployees ?? null,
          longSummary: sp.longBusinessSummary || null,
          website: sp.website || undefined,
          headquarters: hq ?? undefined,
        },
      });
      ok++;
    } catch {
      miss++;
    }
    if (i % 25 === 0)
      process.stdout.write(`\r  ${i}/${top.length}  ok=${ok} miss=${miss}`);
    await sleep(140);
  }
  console.log(`\n  Phase B done. ok=${ok} miss=${miss}`);
  return ok;
}

async function main() {
  console.log("→ Authenticating with Yahoo Finance …");
  await auth();
  const a = await phaseA();
  const b = await phaseB();
  await prisma.updateLog.create({
    data: { job: "enrich-financials", ok: a + b, failed: 0, notes: `phaseA=${a} phaseB=${b}` },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
