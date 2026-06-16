/**
 * Scrape "who owns the company" + extra company details. No LLM.
 *
 * Sources (all public):
 *  - NSE shareholding master   → official promoter % and public % + as-of quarter
 *  - Yahoo majorHoldersBreakdown → institutional % (FII+DII) and insider %
 *  - BSE ComHeadernew          → granular industry, face value (extra detail)
 *
 * Produces a clean 3-way split that sums to ~100:
 *   Promoters / Institutions (FII+DII) / Public (retail)
 *
 * Run: pnpm enrich:own            (top 2500 by market cap)
 *      OWN_LIMIT=0 pnpm enrich:own    (all companies — slow)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const LIMIT = parseInt(process.env.OWN_LIMIT ?? "2500", 10);
const CONCURRENCY = parseInt(process.env.OWN_CONCURRENCY ?? "4", 10);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const numOrNull = (v: unknown) => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return n != null && isFinite(n) ? n : null;
};

const MON: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};
function parseNseDate(s?: string): Date | null {
  if (!s) return null;
  const m = s.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
  if (!m) return null;
  const mon = MON[m[2].toUpperCase()];
  if (mon == null) return null;
  return new Date(Date.UTC(+m[3], mon, +m[1]));
}

// ---------- NSE session + shareholding master ----------
let nseCookie = "";
async function nseAuth() {
  const warm = await fetch("https://www.nseindia.com/", { headers: { "User-Agent": UA } });
  const a = (warm.headers.get("set-cookie") || "").split(",").map((s) => s.split(";")[0]);
  const warm2 = await fetch(
    "https://www.nseindia.com/companies-listing/corporate-filings-shareholding-pattern",
    { headers: { "User-Agent": UA, Cookie: a.join("; ") } }
  );
  const b = (warm2.headers.get("set-cookie") || "").split(",").map((s) => s.split(";")[0]);
  nseCookie = [...a, ...b].filter(Boolean).join("; ");
}

async function nseShareholding(symbol: string): Promise<{
  promoter: number | null;
  publicVal: number | null;
  date: Date | null;
} | null> {
  const url = `https://www.nseindia.com/api/corporate-share-holdings-master?index=equities&symbol=${encodeURIComponent(symbol)}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Cookie: nseCookie,
        Accept: "*/*",
        Referer: "https://www.nseindia.com/companies-listing/corporate-filings-shareholding-pattern",
      },
    });
    if (res.status === 401 || res.status === 403) {
      await nseAuth();
      continue;
    }
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim().startsWith("[")) return null;
    const rows = JSON.parse(text) as Array<{
      pr_and_prgrp?: string;
      public_val?: string;
      date?: string;
    }>;
    if (!rows.length) return null;
    const latest = rows[0]; // master returns newest-first
    return {
      promoter: numOrNull(latest.pr_and_prgrp),
      publicVal: numOrNull(latest.public_val),
      date: parseNseDate(latest.date),
    };
  }
  return null;
}

// ---------- Yahoo holders ----------
let yCookie = "";
let yCrumb = "";
async function yahooAuth() {
  const c = await fetch("https://fc.yahoo.com", { headers: { "User-Agent": UA } });
  yCookie = (c.headers.get("set-cookie") || "")
    .split(",").map((s) => s.split(";")[0]).filter(Boolean).join("; ");
  const r = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": UA, Cookie: yCookie },
  });
  yCrumb = (await r.text()).trim();
}

async function yahooHolders(sym: string): Promise<{
  institutions: number | null;
  insiders: number | null;
} | null> {
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=majorHoldersBreakdown&crumb=${yCrumb}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Cookie: yCookie } });
  if (res.status === 401) {
    await yahooAuth();
    return null;
  }
  if (!res.ok) return null;
  const data = await res.json();
  const m = data?.quoteSummary?.result?.[0]?.majorHoldersBreakdown;
  if (!m) return null;
  const inst = m.institutionsPercentHeld?.raw;
  const ins = m.insidersPercentHeld?.raw;
  return {
    institutions: inst != null ? inst * 100 : null,
    insiders: ins != null ? ins * 100 : null,
  };
}

// ---------- BSE company header (extra detail) ----------
async function bseHeader(scripcode: string): Promise<{
  industry: string | null;
  faceValue: number | null;
} | null> {
  const url = `https://api.bseindia.com/BseIndiaAPI/api/ComHeadernew/w?quotetype=EQ&scripcode=${scripcode}&seriesid=`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Referer: "https://www.bseindia.com/", Origin: "https://www.bseindia.com" },
  });
  if (!res.ok) return null;
  const j = await res.json().catch(() => null);
  if (!j) return null;
  const industry = (j.IndustryNew || j.ISubGroup || j.Industry || "").trim() || null;
  const fv = numOrNull(j.FaceVal);
  return { industry, faceValue: fv };
}

async function main() {
  await Promise.all([nseAuth(), yahooAuth()]);
  console.log("→ Sessions ready (NSE + Yahoo)");

  // Incremental by default: skip rows already filled so re-runs fill gaps
  // left by NSE throttling. FORCE=1 re-fetches everything.
  const where = process.env.FORCE === "1" ? {} : { shareholdingDate: null };
  const companies = await prisma.company.findMany({
    where,
    orderBy: { marketCap: { sort: "desc", nulls: "last" } },
    take: LIMIT > 0 ? LIMIT : undefined,
    select: {
      id: true, symbol: true, exchange: true, yahooSymbol: true, bseCode: true,
    },
  });
  console.log(`→ Enriching ownership for ${companies.length} companies (concurrency=${CONCURRENCY})`);

  let ok = 0, miss = 0, cursor = 0;

  async function worker() {
    while (cursor < companies.length) {
      const c = companies[cursor++];
      try {
        const onNSE = c.exchange === "NSE" || c.exchange === "BOTH";

        const [nse, yh, bse] = await Promise.all([
          onNSE ? nseShareholding(c.symbol) : Promise.resolve(null),
          c.yahooSymbol ? yahooHolders(c.yahooSymbol) : Promise.resolve(null),
          c.bseCode ? bseHeader(c.bseCode) : Promise.resolve(null),
        ]);

        // Promoter: NSE official, else Yahoo insiders proxy
        let promoter = nse?.promoter ?? null;
        let src = "NSE";
        if (promoter == null && yh?.insiders != null) {
          promoter = yh.insiders;
          src = "Yahoo";
        }

        const institutions = yh?.institutions ?? null;

        // Public (retail) = 100 - promoter - institutions, when we have the pieces
        let publicRetail: number | null = null;
        if (promoter != null && institutions != null) {
          publicRetail = clamp(100 - promoter - institutions);
        } else if (nse?.publicVal != null) {
          publicRetail = nse.publicVal; // raw public (incl. institutions) when no Yahoo split
        }

        const data: Record<string, unknown> = {};
        if (promoter != null) data.promoterHolding = clamp(promoter);
        if (institutions != null) data.institutionalHolding = clamp(institutions);
        if (publicRetail != null) data.publicHolding = publicRetail;
        if (nse?.date) data.shareholdingDate = nse.date;
        if (promoter != null || institutions != null) data.shareholdingSrc = src;
        if (bse?.industry) data.industry = bse.industry;
        if (bse?.faceValue != null) data.faceValue = bse.faceValue;

        if (Object.keys(data).length) {
          await prisma.company.update({ where: { id: c.id }, data });
          ok++;
        } else {
          miss++;
        }
      } catch (e) {
        miss++;
        if (miss <= 8) console.warn(`  ${c.symbol}: ${(e as Error).message}`);
      }
      if ((ok + miss) % 25 === 0)
        process.stdout.write(`\r  ${ok + miss}/${companies.length}  ok=${ok} miss=${miss}`);
      await sleep(60);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\n✔ Ownership enrich complete. ok=${ok} miss=${miss}`);
  await prisma.updateLog.create({
    data: { job: "enrich-ownership", ok, failed: miss, notes: `limit=${LIMIT}` },
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
