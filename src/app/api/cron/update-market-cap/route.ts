import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { yahooAuth, fetchQuotes } from "@/lib/yahoo";
import { SITE_URL as SITE } from "@/lib/site";
import { SECTORS } from "@/lib/sectors";
import { slugify } from "@/lib/slug";
import { SCREENS } from "@/lib/screens";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Allow a long run — refreshing thousands of symbols in batches.
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const url = new URL(req.url);
  const fromQs = url.searchParams.get("token");
  const fromHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return fromQs === expected || fromHeader === expected;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * IndexNow — instantly tells Bing/Yandex (and, increasingly, other engines) that
 * pages changed, so a young site gets recrawled faster. Best-effort: never
 * throws into the cron response. Requires INDEXNOW_KEY and the key text hosted
 * at `${SITE}/<key>.txt` (drop `public/<key>.txt` containing exactly the key).
 */
async function submitIndexNow(key: string, urlList: string[]): Promise<number> {
  const host = SITE.replace(/^https?:\/\//, "");
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation: `${SITE}/${key}.txt`, urlList }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? urlList.length : 0;
  } catch {
    return 0;
  }
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    const companies = await prisma.company.findMany({
      where: { yahooSymbol: { not: null } },
      select: { id: true, yahooSymbol: true },
    });
    const bySym = new Map(companies.map((c) => [c.yahooSymbol!, c.id]));
    const symbols = [...bySym.keys()];

    const auth = await yahooAuth();
    const BATCH = 50;

    for (let i = 0; i < symbols.length; i += BATCH) {
      const slice = symbols.slice(i, i + BATCH);
      let quotes;
      try {
        quotes = await fetchQuotes(slice, auth);
      } catch (e) {
        failed += slice.length;
        if (errors.length < 10) errors.push(`batch ${i}: ${(e as Error).message}`);
        continue;
      }
      await Promise.all(
        [...quotes.entries()].map(async ([sym, u]) => {
          const id = bySym.get(sym);
          if (!id) return;
          try {
            await prisma.company.update({
              where: { id },
              data: {
                currentPrice: u.currentPrice,
                dayChange: u.dayChange,
                dayChangePct: u.dayChangePct,
                marketCap: u.marketCap ?? undefined,
                peRatio: u.peRatio,
                pbRatio: u.pbRatio,
                eps: u.eps,
                bookValue: u.bookValue,
                high52: u.high52,
                low52: u.low52,
                dividendYield: u.dividendYield,
                pricedAt: new Date(),
              },
            });
            updated++;
          } catch {
            failed++;
          }
        })
      );
      await sleep(100);
    }

    revalidatePath("/");
    revalidatePath("/companies");
    revalidatePath("/exchange/nse");
    revalidatePath("/exchange/bse");
    revalidatePath("/stocks");
    for (const s of SCREENS) revalidatePath(`/stocks/${s.slug}`);
    revalidateTag("companies", "max");

    // Freshness signal: nudge search engines to recrawl the highest-value URLs.
    // Bounded set (core + sectors + screens + top-cap companies) so we never
    // spam the full corpus. No-op unless INDEXNOW_KEY is configured.
    let submitted = 0;
    const indexNowKey = process.env.INDEXNOW_KEY;
    if (indexNowKey) {
      try {
        const top = await prisma.company.findMany({
          where: { marketCap: { not: null } },
          orderBy: { marketCap: "desc" },
          take: 200,
          select: { slug: true },
        });
        const urls = [
          `${SITE}/`,
          `${SITE}/companies`,
          `${SITE}/stocks`,
          `${SITE}/browse`,
          `${SITE}/exchange/nse`,
          `${SITE}/exchange/bse`,
          ...SECTORS.map((s) => `${SITE}/sector/${slugify(s)}`),
          ...SCREENS.map((s) => `${SITE}/stocks/${s.slug}`),
          ...top.map((c) => `${SITE}/companies/${c.slug}`),
        ];
        submitted = await submitIndexNow(indexNowKey, urls);
      } catch {
        // best-effort only
      }
    }

    await prisma.updateLog.create({
      data: {
        job: "cron:update-market-cap",
        ok: updated,
        failed,
        notes: `symbols=${symbols.length} ms=${Date.now() - start} indexnow=${submitted}`,
      },
    });

    return NextResponse.json({
      ok: true,
      updated,
      failed,
      submitted,
      elapsedMs: Date.now() - start,
      errors: errors.length ? errors : undefined,
    });
  } catch (e) {
    await prisma.updateLog.create({
      data: { job: "cron:update-market-cap", ok: updated, failed: failed + 1, notes: `fatal=${(e as Error).message}` },
    });
    return NextResponse.json(
      { ok: false, error: (e as Error).message, updated, failed },
      { status: 500 }
    );
  }
}
