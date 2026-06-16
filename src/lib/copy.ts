/**
 * Programmatic 200–300 word company descriptions.
 * Deterministic from the company record — no LLM call at request time.
 * This is a substitute for AI-generated copy at seed time; swap with a
 * real LLM pass during seeding if/when keys are available.
 */
import type { Company } from "@prisma/client";
import { crFromCr } from "./format";

const SECTOR_BLURBS: Record<string, string> = {
  "Financial Services":
    "operates in India's financial services sector, an industry that intermediates the flow of capital between savers and the productive economy",
  "Information Technology":
    "operates in the Indian information technology sector, which has historically been one of the country's strongest engines of services-led exports",
  "Oil Gas & Consumable Fuels":
    "operates in the oil, gas and consumable-fuels sector that sits at the base of India's industrial supply chain",
  "Fast Moving Consumer Goods":
    "sells fast-moving consumer goods to the Indian market, a category defined by short purchase cycles, deep distribution, and brand-led pricing power",
  "Automobile and Auto Components":
    "participates in India's automobile and auto-components value chain, a vertical tightly coupled with rural sentiment and household credit",
  "Healthcare":
    "operates in healthcare, a sector that combines regulated pricing with long-run demand growth from a rising domestic patient base",
  "Metals & Mining":
    "operates in metals and mining, where earnings are levered to global commodity cycles and domestic infrastructure spend",
  "Power":
    "operates in the power sector, which sits between regulated tariffs and the rising demand from industry, data centres, and households",
  "Telecommunication":
    "operates in telecommunications, a capital-intensive sector defined by spectrum economics and high ARPU sensitivity",
  "Construction":
    "operates in construction and infrastructure, where order-book visibility and execution capacity drive financial performance",
  "Capital Goods":
    "manufactures capital goods, riding the multi-year industrial and defence capex cycle India is currently going through",
  "Chemicals":
    "operates in specialty and bulk chemicals, a vertical benefiting from the global \"China + 1\" supply-chain reorganisation",
  "Consumer Durables":
    "sells consumer durables to Indian households, a category tied to discretionary income and credit availability",
  "Consumer Services":
    "operates in consumer services, a segment driven by rising discretionary spend among urban Indian households",
  "Realty":
    "operates in real estate, where launch velocity and inventory turnover determine cash conversion",
  "Textiles":
    "operates in textiles and apparel, a labour-intensive export sector responsive to global retail demand",
  "Media Entertainment & Publication":
    "operates in media and entertainment, a sector being reshaped by streaming economics and ad-revenue concentration",
  "Services":
    "operates in business services across logistics, transport, and B2B segments",
  "Forest Materials":
    "operates in forest-derived materials including paper, sugar, and allied agro-processing",
  "Diversified":
    "operates a diversified business across multiple verticals of the Indian economy",
};

const formalize = (name: string) => name.replace(/\s+ltd$/i, " Limited");

export function companyDescription(c: Company): string {
  const name = formalize(c.name);
  const ex =
    c.exchange === "BOTH"
      ? "the National Stock Exchange (NSE) and the Bombay Stock Exchange (BSE)"
      : c.exchange === "NSE"
        ? "the National Stock Exchange (NSE)"
        : "the Bombay Stock Exchange (BSE)";
  const sector = c.sector ?? "Diversified";
  const sectorBlurb = SECTOR_BLURBS[sector] ?? SECTOR_BLURBS["Diversified"];
  const cap = c.marketCap ? crFromCr(c.marketCap) : null;

  const sym = c.symbol;
  const isin = c.isin ? ` Its securities trade under ISIN ${c.isin}.` : "";
  const series = c.series ? ` It is listed under the ${c.series} series.` : "";
  const founded = c.foundedYear ? ` The company was founded in ${c.foundedYear}.` : "";
  const hq = c.headquarters ? ` Its registered office is in ${c.headquarters}.` : "";

  const para1 = `${name} (NSE/BSE: ${sym}) is an Indian publicly listed company quoted on ${ex}. The company ${sectorBlurb}.${founded}${hq}${isin}${series}`;

  const capLine = cap
    ? ` As of the most recent update, ${name} carries an equity market capitalisation of approximately ${cap}, which places it among the tracked constituents of the ${sector} sector on Indian exchanges.`
    : ` The company is part of the broader ${sector} sector universe on Indian exchanges.`;

  const promoters =
    c.promoterHolding != null
      ? ` Promoter holding in ${sym} stands at roughly ${c.promoterHolding.toFixed(2)}%, with the residual float distributed across institutional and public shareholders.`
      : ` Detailed shareholding-pattern disclosures are published quarterly by ${name} via stock-exchange filings.`;

  const para2 = `${capLine}${promoters} For investors and researchers tracking ${sector.toLowerCase()} listings, ${sym} provides a window into how listed Indian capital is being allocated within the sector — by promoters, by foreign institutions, and by retail participants.`;

  const para3 = `This page consolidates ${name}'s core registration, listing and shareholding data into a single open record. Figures are refreshed weekly from the official NSE archives and BSE scrip master; the company's own filings remain the authoritative source for governance, financial and disclosure data.`;

  return [para1, para2, para3].join("\n\n");
}

export function companyFaqs(c: Company): Array<{ q: string; a: string }> {
  const name = formalize(c.name);
  const cap = c.marketCap ? crFromCr(c.marketCap) : "not currently tracked in this database";
  return [
    {
      q: `What is the CIN of ${name}?`,
      a: c.cin
        ? `The Corporate Identity Number (CIN) of ${name} is ${c.cin}.`
        : `The Corporate Identity Number for ${name} is published in the MCA21 corporate master. FinanceCity backfills CIN values during weekly refreshes.`,
    },
    {
      q: `Who are the promoters of ${name}?`,
      a:
        c.promoterHolding != null
          ? `Promoter holding in ${c.symbol} is approximately ${c.promoterHolding.toFixed(2)}%, as disclosed in the latest published shareholding pattern.`
          : `Promoter and group-holding details for ${name} are disclosed quarterly via stock-exchange filings. Detailed pattern is refreshed weekly here from BSE and NSE corporate filings.`,
    },
    {
      q: `What is the market capitalisation of ${name}?`,
      a:
        c.marketCap
          ? `${name} (${c.symbol}) has a market capitalisation of approximately ${cap}, reflecting the most recent weekly refresh from the BSE scrip master.`
          : `Market capitalisation for ${name} will appear here once it is published in the next weekly refresh from exchange archives.`,
    },
  ];
}
