# FinanceCity

Open directory of every active equity listed on **NSE & BSE** — 5,000+ individually SEO-targeted pages of share price, market cap, CIN, ISIN, sector, financials and promoter/institutional ownership. Built as a finance-vertical, AdSense-monetised SEO product.

Live domain: **[financecity.me](https://financecity.me)** · Built with **Next.js 16 (App Router) · TypeScript · Prisma · SQLite/libSQL · Tailwind v4**.

---

## Lighthouse

Audited with Lighthouse 12 (Chrome for Testing) against the production build:

| Surface | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| **Desktop** (app, no ads) | **100** | **100** | **100** | **100** |
| **Mobile** (app, no ads) | 91–95 | **100** | **100** | **100** |
| With Google AdSense live | 100 (desktop) | 100 | ~78¹ | 100 |

¹ Best Practices is capped only by Google AdSense setting a third-party (`doubleclick`) cookie — an unavoidable cost of running ads, true for every AdSense site. Remove ads → 100. Everything else stays 100. All ad/analytics scripts load off the critical path (`afterInteractive`, lazy on intersection) so they never block LCP.

---

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 (App Router, RSC, Turbopack), `optimizeCss` critical-CSS inlining |
| DB | SQLite locally · libSQL/Turso for production |
| ORM | Prisma 6 |
| Styling | Tailwind CSS v4 (`@theme` tokens in `globals.css`, no JS config) |
| Fonts | Fraunces (display) · Inter (body) · JetBrains Mono (data) — self-hosted via `next/font` |
| OG images | `next/og` — per-company card + a branded site-wide card |
| Analytics | Google Analytics 4 + Vercel Analytics + Vercel Speed Insights |
| Ads | Google AdSense (Auto Ads + lazy in-content slots) |
| Cron | Vercel Cron + `/api/cron/update-market-cap` (bearer-secret guarded) |

---

## Data sources

1. **NSE archives** — `EQUITY_L.csv` (symbol, name, ISIN, series, listing date, face value) + the corporate shareholding master (official promoter % / public % + the "as of" quarter).
2. **BSE scrip master** — `ListofScripData` (active universe, BSE codes) + `ComHeadernew` (granular industry, face value).
3. **NSE index CSVs** (Nifty Total Market / 500 / Midcap150 / Smallcap250 / Microcap250) — authoritative sector classification, with name-keyword inference for the long tail.
4. **Yahoo Finance** (cookie + crumb auth) — live price, day change, market cap, P/E, P/B, EPS, book value, 52w range, dividend yield (all companies); plus ROE, ROA, debt, revenue, EBITDA, margins, growth, beta, analyst target + consensus, employees and business summary (top ~1,500 by cap); and `majorHoldersBreakdown` for institutional %.

Merge is keyed on **ISIN**; dual-listed names collapse to one record with `exchange = BOTH`.

---

## Routes

| Path | Type | Notes |
| --- | --- | --- |
| `/` | SSG (1h ISR) | Ticker tape, real-time search, sector grid, top-8 by cap |
| `/companies` | SSR | Directory with sector/exchange filters + pagination |
| `/companies/[slug]` | SSG → ISR (1w) | The SEO money page (top 500 prerendered, rest on demand) |
| `/companies/[slug]/og` | Dynamic | 1200×630 OG image per company |
| `/sector/[sector]`, `/exchange/{nse,bse}` | SSG/SSR | Sector & exchange listings |
| `/about`, `/privacy`, `/disclaimer`, `/contact` | SSG | Required content + AdSense-compliance pages |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | Dynamic | Full URL set, crawl rules, PWA manifest |
| `/api/search?q=` | Dynamic | Relevance-ranked autocomplete |
| `/api/cron/update-market-cap` | Route | Weekly price cron, bearer-token gated |

---

## SEO & monetisation

- **Per-page metadata** — `{Company} ({SYMBOL}) Share Price, CIN, Promoters | FinanceCity` titles, auto descriptions, canonicals, `hreflang en-IN`, OG/Twitter cards.
- **Structured data** — site-wide `Organization` + `WebSite` (with `SearchAction`); per company `Corporation` (with `tickerSymbol`/`isin`/address) + `BreadcrumbList` + `FAQPage`.
- **Sitemap** — every company, sector, exchange and content page with per-surface `priority`/`changeFrequency`.
- **Favicon / PWA** — vector `icon.svg` (rising-bars skyline), generated multi-size `favicon.ico`, `apple-icon`, and a web manifest with theme color.
- **AdSense** — publisher `ca-pub-1720101320139769`: loader + `google-adsense-account` meta + `public/ads.txt`. Auto Ads handle placement; `AdSlot` mounts real units lazily when a slot id is set (`NEXT_PUBLIC_ADSENSE_SLOT`) and renders nothing otherwise (no CLS).
- **Analytics** — GA4 (`G-HBYSKGQNNY`) via `@next/third-parties`; Vercel Analytics + Speed Insights (only injected on Vercel infra).

---

## Setup

```bash
pnpm install
cp .env.example .env       # then edit
pnpm prisma migrate dev    # creates dev.db
pnpm seed                  # NSE + BSE → 5,000+ records + sectors
pnpm enrich:fin            # Yahoo: prices + ratios + financials
pnpm enrich:own            # ownership: promoter / institutional / public
pnpm dev
```

Scripts: `seed` (= `seed:base` + `enrich`), `enrich:fin`, `enrich:own`. See the data-freshness table below.

---

## Environment variables

```env
DATABASE_URL="file:./dev.db"            # libsql://… + TURSO_AUTH_TOKEN for prod
NSE_COOKIE=""                            # only for the live NSE quote endpoint
CRON_SECRET="…"                          # matches Vercel Cron's Authorization: Bearer …
NEXT_PUBLIC_SITE_URL="https://financecity.me"
NEXT_PUBLIC_ADSENSE_CLIENT="ca-pub-1720101320139769"
NEXT_PUBLIC_ADSENSE_SLOT=""              # optional in-content ad-unit slot id
NEXT_PUBLIC_GA_ID="G-HBYSKGQNNY"
# DISABLE_3P=1                           # build-time kill-switch for ads/analytics (clean audits)
```

---

## How the data stays fresh (auto vs manual)

| Data | How | Cadence | Source |
| --- | --- | --- | --- |
| Price, day change, market cap, P/E, P/B, EPS, 52W, div yield | **Automatic** — Vercel Cron → `/api/cron/update-market-cap` | Weekly (Mon 06:00 UTC) | Yahoo Finance (works serverless) |
| Deep financials — ROE, debt, revenue, margins, analyst | Manual — `pnpm enrich:fin` | Monthly-ish | Yahoo `quoteSummary` |
| **Ownership** — promoter / institutional / public, industry | Manual — `pnpm enrich:own` | Quarterly | NSE filings + Yahoo + BSE |
| Company universe (new listings / delistings) | Manual — `pnpm seed` | As needed | NSE + BSE master lists |

**Prices update themselves; ownership you refresh by running the scraper.** Why: prices change daily and Yahoo is reachable from Vercel, but **NSE blocks datacenter IPs**, so `enrich:own` must run from a residential connection or a VPS — and shareholding only changes at quarter-end filings. Re-runs are incremental (skip filled rows; `FORCE=1` to refetch).

---

## Design

- **Color**: `#0D1B2A` ink · `#F5F7FA` paper · `#FAF7F0` paper-warm · `#FF9500` saffron · accent/up/down tuned to pass WCAG AA contrast as text.
- **Type**: Fraunces (display, ~560 weight), Inter (400 body / 600 labels), JetBrains Mono (tickers/CIN/ISIN/prices, tabular nums).
- **Signature**: live exchange-board ticker tape, a saffron "pulse" ring on market cap that animates only during NSE hours, sector left-rail accents, debounced real-time search with keyboard nav. All motion respects `prefers-reduced-motion`.

---

## License

Data sourced from publicly available NSE and BSE archives. Code under MIT.
