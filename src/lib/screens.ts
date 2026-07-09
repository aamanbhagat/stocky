import type { Company } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { inr, pct, ratio, crFromCr, signedPct } from "./format";

/**
 * Curated "best-of" / screener list pages. Each targets a mid-tail, list-intent
 * query ("high dividend stocks", "debt free stocks in india", "top gainers
 * today") that Google's finance widget does NOT answer — a surface a young site
 * can rank on. All are built from existing Company columns, so no new data.
 *
 * `where`/`orderBy` feed Prisma directly; `metric` renders the highlighted
 * column. A market-cap floor keeps illiquid micro-cap noise out of the lists.
 */
export interface ScreenDef {
  slug: string;
  label: string;
  title: string;
  description: string;
  intro: string;
  metricLabel: string;
  where: Prisma.CompanyWhereInput;
  orderBy:
    | Prisma.CompanyOrderByWithRelationInput
    | Prisma.CompanyOrderByWithRelationInput[];
  metric: (c: Company) => string;
}

const MIN_CAP = 100; // ₹100 Cr floor for quality/liquidity on ranked screens

export const SCREENS: ScreenDef[] = [
  {
    slug: "most-valuable-companies",
    label: "Most valuable companies",
    title: "Most Valuable Indian Companies by Market Cap (NSE & BSE)",
    description:
      "The largest NSE & BSE listed companies ranked by market capitalisation, with live price and sector. Updated from exchange data.",
    intro:
      "India's biggest listed companies ranked by market capitalisation. Market cap — share price multiplied by shares outstanding — is the simplest measure of a company's size on the exchange. The list below is drawn from every NSE and BSE listing FinanceCity tracks and refreshes with the latest prices.",
    metricLabel: "Market cap",
    where: { marketCap: { not: null } },
    orderBy: { marketCap: "desc" },
    metric: (c) => crFromCr(c.marketCap),
  },
  {
    slug: "high-dividend-stocks",
    label: "High dividend stocks",
    title: "Highest Dividend Yield Stocks in India (NSE & BSE)",
    description:
      "NSE & BSE stocks ranked by trailing dividend yield. Compare payout, market cap and sector before you buy for income.",
    intro:
      "Stocks ranked by trailing dividend yield — the annual dividend as a percentage of the share price. A high yield can signal income, but it can also reflect a falling price or an unsustainable payout, so always check the payout ratio and earnings trend on each company's page. Only companies above a minimum size are shown to keep the list liquid.",
    metricLabel: "Dividend yield",
    where: { dividendYield: { gt: 0 }, marketCap: { gte: MIN_CAP } },
    orderBy: { dividendYield: "desc" },
    metric: (c) => pct(c.dividendYield),
  },
  {
    slug: "high-roe-stocks",
    label: "High ROE stocks",
    title: "Highest ROE Stocks in India — Return on Equity (NSE & BSE)",
    description:
      "Indian stocks ranked by return on equity (ROE). Find consistently profitable NSE & BSE companies that compound shareholder capital efficiently.",
    intro:
      "Return on equity (ROE) measures how much profit a company generates on each rupee of shareholder equity — a core marker of quality and capital efficiency. The companies below post the highest ROE among tracked NSE and BSE listings above a minimum size. ROE should be read alongside debt, since leverage can flatter it.",
    metricLabel: "ROE",
    where: { roe: { not: null }, marketCap: { gte: MIN_CAP } },
    orderBy: { roe: "desc" },
    metric: (c) => pct(c.roe),
  },
  {
    slug: "debt-free-stocks",
    label: "Debt-free stocks",
    title: "Debt-Free Stocks in India (Low Debt-to-Equity, NSE & BSE)",
    description:
      "Effectively debt-free Indian companies — NSE & BSE stocks with negligible debt-to-equity. Lower balance-sheet risk through the cycle.",
    intro:
      "Companies that carry little to no borrowing — a debt-to-equity ratio at or near zero. Low leverage means less balance-sheet risk when rates rise or earnings wobble, though some businesses simply need less debt than others. The list shows effectively debt-free NSE and BSE companies above a minimum size, largest first.",
    metricLabel: "Debt / equity",
    where: { debtToEquity: { lte: 0.05, not: null }, marketCap: { gte: MIN_CAP } },
    orderBy: { marketCap: "desc" },
    metric: (c) => ratio(c.debtToEquity),
  },
  {
    slug: "low-pe-stocks",
    label: "Low P/E stocks",
    title: "Lowest P/E Ratio Stocks in India (Value Screen, NSE & BSE)",
    description:
      "NSE & BSE stocks ranked by lowest price-to-earnings (P/E) ratio — a starting point for value screening. Compare with sector and growth.",
    intro:
      "Stocks with the lowest price-to-earnings (P/E) ratios among tracked listings — a classic starting point for value screening. A low P/E can mean a stock is cheap, or that the market expects earnings to fall, so compare each name against its sector and growth on the company page. A market-cap floor filters out illiquid micro-caps.",
    metricLabel: "P/E",
    where: { peRatio: { gt: 0 }, marketCap: { gte: MIN_CAP } },
    orderBy: { peRatio: "asc" },
    metric: (c) => ratio(c.peRatio),
  },
  {
    slug: "high-growth-stocks",
    label: "High revenue-growth stocks",
    title: "Highest Revenue Growth Stocks in India (NSE & BSE)",
    description:
      "Indian companies ranked by year-on-year revenue growth. Find the fastest-growing NSE & BSE listings by top line.",
    intro:
      "Companies ranked by year-on-year revenue growth — the fastest-expanding top lines among tracked NSE and BSE listings above a minimum size. Fast revenue growth is a tailwind, but check whether it converts to profit and cash flow, and at what valuation, on each company's page.",
    metricLabel: "Revenue growth",
    where: { revenueGrowth: { not: null }, marketCap: { gte: MIN_CAP } },
    orderBy: { revenueGrowth: "desc" },
    metric: (c) => signedPct(c.revenueGrowth),
  },
  {
    slug: "top-gainers-today",
    label: "Top gainers today",
    title: "Top Gainers Today — NSE & BSE Stocks Up the Most",
    description:
      "NSE & BSE stocks with the biggest gains in the latest session, ranked by day change. Live-tracked from exchange data.",
    intro:
      "The tracked NSE and BSE stocks up the most in the latest session, ranked by percentage day change. Intraday moves can be driven by results, news or low liquidity, so treat a one-day pop as a starting point for research, not a signal. Figures reflect the most recent price refresh.",
    metricLabel: "Day change",
    where: { dayChangePct: { not: null }, marketCap: { gte: MIN_CAP } },
    orderBy: { dayChangePct: "desc" },
    metric: (c) => signedPct(c.dayChangePct),
  },
  {
    slug: "top-losers-today",
    label: "Top losers today",
    title: "Top Losers Today — NSE & BSE Stocks Down the Most",
    description:
      "NSE & BSE stocks with the biggest falls in the latest session, ranked by day change. Live-tracked from exchange data.",
    intro:
      "The tracked NSE and BSE stocks down the most in the latest session, ranked by percentage day change. Sharp falls can reflect weak results, sector news or profit-taking — use each company's page to see whether the drop changes the underlying picture. Figures reflect the most recent price refresh.",
    metricLabel: "Day change",
    where: { dayChangePct: { not: null }, marketCap: { gte: MIN_CAP } },
    orderBy: { dayChangePct: "asc" },
    metric: (c) => signedPct(c.dayChangePct),
  },
];

export function getScreen(slug: string): ScreenDef | undefined {
  return SCREENS.find((s) => s.slug === slug);
}
