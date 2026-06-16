/**
 * Enrich Company.sector using:
 *  1. NSE Nifty 500 CSV (authoritative industry for top 500)
 *  2. NSE Nifty Total Market CSV (industry for top 750)
 *  3. Name-keyword inference for the long tail
 *
 * Run after seed: pnpm tsx scripts/enrich-sectors.ts
 */
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { inferSector } from "../src/lib/sectors";

const prisma = new PrismaClient();
const UA = "Mozilla/5.0";

const SOURCES = [
  "https://nsearchives.nseindia.com/content/indices/ind_niftytotalmarket_list.csv",
  "https://nsearchives.nseindia.com/content/indices/ind_nifty500list.csv",
  "https://nsearchives.nseindia.com/content/indices/ind_niftymidcap150list.csv",
  "https://nsearchives.nseindia.com/content/indices/ind_niftysmallcap250list.csv",
  "https://nsearchives.nseindia.com/content/indices/ind_niftymicrocap250_list.csv",
];

async function loadIndustryByIsin(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const url of SOURCES) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) {
        console.warn(`  ${url} → ${res.status}`);
        continue;
      }
      const text = await res.text();
      const rows: Record<string, string>[] = parse(text, {
        columns: (h) => h.map((c: string) => c.trim()),
        skip_empty_lines: true,
        trim: true,
      });
      let added = 0;
      for (const r of rows) {
        const isin = (r["ISIN Code"] || r["ISIN CODE"] || "").trim();
        const ind = (r["Industry"] || r["INDUSTRY"] || "").trim();
        if (isin && ind && !map.has(isin)) {
          map.set(isin, ind);
          added++;
        }
      }
      console.log(`  ${url.split("/").pop()} +${added}`);
    } catch (e) {
      console.warn(`  ${url} failed: ${(e as Error).message}`);
    }
  }
  return map;
}

// Name-keyword fallback (only used when no industry data found)
const NAME_HINTS: Array<[RegExp, string]> = [
  [/\bbank\b|\bbk\b/i, "Financial Services"],
  [/\bfinanc|fincorp|finvest|nbfc|capital|investment|loan|housing finance|microfin/i, "Financial Services"],
  [/\binsur(ance)?\b/i, "Financial Services"],
  [/\b(infotech|tech(no)?|software|systems|infosys|wipro|tcs|cognizant|datamatics|cyient|coforge|persistent)\b/i, "Information Technology"],
  [/\bpharma|labs|laborator|biocon|biotech|hospital|healthcare|life sciences|drugs/i, "Healthcare"],
  [/\bmotors?|auto|tyres?|tires?|bajaj auto|hero|mahindra|tvs|maruti|ashok leyland/i, "Automobile and Auto Components"],
  [/\bsteel|iron|metal|copper|zinc|aluminium|aluminum|hindalco|jsw|sail|nalco|tata steel/i, "Metals & Mining"],
  [/\bmines?|mining|coal/i, "Metals & Mining"],
  [/\boil|petro|gas|hpcl|bpcl|iocl|ongc|gail|reliance industries/i, "Oil Gas & Consumable Fuels"],
  [/\bpower|electric|grid|ntpc|adani green|tata power|jsw energy/i, "Power"],
  [/\btelecom|airtel|vodafone|jio|wireless|broadband/i, "Telecommunication"],
  [/\bcement|ultratech|ambuja|acc|shree cement|dalmia/i, "Construction"],
  [/\b(infra|construct|engineer|projects|l&t|larsen)\b/i, "Construction"],
  [/\bchemical|specialty|fertili[sz]er|paint|asian paints|kansai|berger|aarti|deepak/i, "Chemicals"],
  [/\bfmcg|hindustan unilever|nestle|dabur|godrej consumer|marico|tata consumer|britannia|colgate|ITC\b/i, "Fast Moving Consumer Goods"],
  [/\btextile|spinning|cotton|denim|garment|apparel|fabric|raymond/i, "Textiles"],
  [/\bmedia|broadcast|publish|film|tv|entertain|zee|sun tv|inox/i, "Media Entertainment & Publication"],
  [/\brealty|real estate|builder|properties|develop|dlf|godrej properties|oberoi/i, "Realty"],
  [/\b(retail|consumer service|hotel|tourism|trent|jubilant|titan)\b/i, "Consumer Services"],
  [/\bdurabl|appliance|whirlpool|voltas|havells|crompton|symphony|kajaria|cera/i, "Consumer Durables"],
  [/\blogistic|transport|courier|shipping|cargo|warehous|adani port/i, "Services"],
  [/\bpaper|sugar|forest|timber|wood/i, "Forest Materials"],
  [/\bmachine|industrial|equipment|defen[sc]e|abb|siemens|cummins|bhel/i, "Capital Goods"],
];

function nameInfer(name: string): string {
  for (const [re, sec] of NAME_HINTS) if (re.test(name)) return sec;
  return "Diversified";
}

async function main() {
  console.log("→ Loading NSE industry CSVs …");
  const byIsin = await loadIndustryByIsin();
  console.log(`  Got industry for ${byIsin.size} ISINs.`);

  const companies = await prisma.company.findMany({
    select: { id: true, isin: true, name: true, sector: true, industry: true },
  });
  console.log(`→ Re-sectoring ${companies.length} companies …`);

  let viaIndex = 0;
  let viaName = 0;
  let stillDiversified = 0;
  const tx: Array<{ id: number; sector: string; industry: string | null }> = [];

  for (const c of companies) {
    let industry: string | null = c.industry;
    let sector: string;

    if (c.isin && byIsin.has(c.isin)) {
      industry = byIsin.get(c.isin)!;
      sector = inferSector(industry);
      viaIndex++;
    } else if (c.industry) {
      sector = inferSector(c.industry);
    } else {
      sector = nameInfer(c.name);
      if (sector !== "Diversified") viaName++;
      else stillDiversified++;
    }

    if (sector !== c.sector || industry !== c.industry) {
      tx.push({ id: c.id, sector, industry });
    }
  }

  console.log(`  via index=${viaIndex}  via name=${viaName}  diversified=${stillDiversified}`);
  console.log(`→ Writing ${tx.length} updates …`);

  const BATCH = 200;
  for (let i = 0; i < tx.length; i += BATCH) {
    const slice = tx.slice(i, i + BATCH);
    await prisma.$transaction(
      slice.map((u) =>
        prisma.company.update({
          where: { id: u.id },
          data: { sector: u.sector, industry: u.industry },
        })
      )
    );
    process.stdout.write(`\r  ${Math.min(i + BATCH, tx.length)}/${tx.length}`);
  }
  console.log("\n✔ Enrich complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
