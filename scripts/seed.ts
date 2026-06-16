/**
 * Seed: fetch NSE + BSE listed-company universes, merge by ISIN, slug, save.
 *
 * Run: pnpm seed
 */
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { companySlug } from "../src/lib/slug";
import { inferSector } from "../src/lib/sectors";

const prisma = new PrismaClient();

const NSE_CSV = "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv";
const BSE_JSON =
  "https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

type Raw = {
  isin: string | null;
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE" | "BOTH";
  industry: string | null;
  listingDate: Date | null;
  faceValue: number | null;
  series: string | null;
  marketCapCr: number | null;
  bseCode: string | null;
};

async function fetchNSE(): Promise<Raw[]> {
  console.log("→ Fetching NSE EQUITY_L.csv …");
  const res = await fetch(NSE_CSV, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`NSE CSV ${res.status}`);
  const text = await res.text();
  const rows: Record<string, string>[] = parse(text, {
    columns: (h: string[]) => h.map((c) => c.trim()),
    skip_empty_lines: true,
    trim: true,
  });
  console.log(`  NSE rows: ${rows.length}`);
  return rows.map((r) => {
    const isin = (r["ISIN NUMBER"] || "").trim() || null;
    const symbol = (r["SYMBOL"] || "").trim();
    const name = (r["NAME OF COMPANY"] || "").trim();
    const series = (r["SERIES"] || "").trim() || null;
    const listing = (r["DATE OF LISTING"] || "").trim();
    let listingDate: Date | null = null;
    if (listing) {
      const d = new Date(listing.replace(/-/g, " "));
      if (!isNaN(d.getTime())) listingDate = d;
    }
    const fv = parseFloat(r["FACE VALUE"]);
    return {
      isin,
      symbol,
      name,
      exchange: "NSE" as const,
      industry: null,
      listingDate,
      faceValue: isNaN(fv) ? null : fv,
      series,
      marketCapCr: null,
      bseCode: null,
    };
  });
}

async function fetchBSE(): Promise<Raw[]> {
  console.log("→ Fetching BSE scrip master …");
  const res = await fetch(BSE_JSON, {
    headers: {
      "User-Agent": UA,
      Referer: "https://www.bseindia.com/",
      Origin: "https://www.bseindia.com",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`BSE ${res.status}`);
  const data = (await res.json()) as Array<{
    SCRIP_CD: string;
    Scrip_Name: string;
    ISIN_NUMBER: string | null;
    INDUSTRY: string | null;
    scrip_id: string;
    Issuer_Name: string;
    Mktcap: string | number | null;
    FACE_VALUE: string | null;
    Segment: string;
    Status: string;
  }>;
  console.log(`  BSE rows: ${data.length}`);
  return data
    .filter((r) => r.Status === "Active" && r.Segment === "Equity")
    .map((r) => {
      const mc = typeof r.Mktcap === "string" ? parseFloat(r.Mktcap) : r.Mktcap;
      const fv = r.FACE_VALUE ? parseFloat(r.FACE_VALUE) : null;
      return {
        isin: (r.ISIN_NUMBER || "").trim() || null,
        symbol: (r.scrip_id || r.SCRIP_CD).trim(),
        name: (r.Issuer_Name || r.Scrip_Name || "").trim(),
        exchange: "BSE" as const,
        industry: r.INDUSTRY || null,
        listingDate: null,
        faceValue: fv && !isNaN(fv) ? fv : null,
        series: null,
        marketCapCr: typeof mc === "number" && !isNaN(mc) ? mc : null,
        bseCode: r.SCRIP_CD,
      } as Raw;
    });
}

function merge(nse: Raw[], bse: Raw[]): Raw[] {
  const byIsin = new Map<string, Raw>();
  const orphans: Raw[] = [];

  // BSE first as the broader universe + has market cap
  for (const r of bse) {
    if (r.isin) byIsin.set(r.isin, { ...r });
    else orphans.push(r);
  }
  // Merge NSE into matching ISIN; otherwise treat as NSE-only
  for (const r of nse) {
    if (r.isin && byIsin.has(r.isin)) {
      const merged = byIsin.get(r.isin)!;
      merged.exchange = "BOTH";
      // Prefer NSE symbol when both listed (more recognizable)
      merged.symbol = r.symbol;
      merged.series = r.series ?? merged.series;
      merged.listingDate = r.listingDate ?? merged.listingDate;
      merged.faceValue = r.faceValue ?? merged.faceValue;
      // BSE name is often more formal; keep BSE name
    } else if (r.isin) {
      byIsin.set(r.isin, { ...r });
    } else {
      orphans.push(r);
    }
  }

  return [...byIsin.values(), ...orphans];
}

function ensureUniqueSlug(taken: Set<string>, base: string): string {
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  const next = `${base}-${i}`;
  taken.add(next);
  return next;
}

async function main() {
  const [nse, bse] = await Promise.all([fetchNSE(), fetchBSE()]);
  const merged = merge(nse, bse);
  console.log(`→ Merged unique companies: ${merged.length}`);

  const slugs = new Set<string>();
  let upserted = 0;
  let skipped = 0;

  // Bulk strategy: clear existing + insert in batches
  await prisma.company.deleteMany({});

  const batch: ReturnType<typeof toRecord>[] = [];
  const BATCH = 500;

  function toRecord(r: Raw) {
    const sector = inferSector(r.industry);
    const slug = ensureUniqueSlug(slugs, companySlug(r.name, r.symbol));
    return {
      slug,
      symbol: r.symbol,
      name: r.name,
      isin: r.isin,
      exchange: r.exchange,
      sector,
      industry: r.industry,
      marketCap: r.marketCapCr, // stored in Cr units
      faceValue: r.faceValue,
      series: r.series,
      bseCode: r.bseCode,
      yahooSymbol:
        r.exchange === "BSE"
          ? r.bseCode
            ? `${r.bseCode}.BO`
            : null
          : `${r.symbol}.NS`,
      listingDate: r.listingDate,
      // Shareholding pattern placeholder — backfill later via NSE shareholding API
      // Description left null; generate via AI in a follow-up pass.
    };
  }

  for (const r of merged) {
    if (!r.name || !r.symbol) {
      skipped++;
      continue;
    }
    batch.push(toRecord(r));
    if (batch.length >= BATCH) {
      const chunk = batch.splice(0, batch.length);
      try {
        await prisma.company.createMany({ data: chunk });
        upserted += chunk.length;
      } catch (e) {
        // Fall back to individual inserts to skip dupes
        for (const row of chunk) {
          try {
            await prisma.company.create({ data: row });
            upserted++;
          } catch {
            skipped++;
          }
        }
      }
      process.stdout.write(`\r  inserted ${upserted}…`);
    }
  }
  if (batch.length) {
    try {
      await prisma.company.createMany({ data: batch });
      upserted += batch.length;
    } catch {
      for (const row of batch) {
        try {
          await prisma.company.create({ data: row });
          upserted++;
        } catch {
          skipped++;
        }
      }
    }
  }
  console.log(`\n✔ Seed complete. inserted=${upserted} skipped=${skipped}`);

  await prisma.updateLog.create({
    data: { job: "seed", ok: upserted, failed: skipped, notes: `nse=${nse.length} bse=${bse.length}` },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
