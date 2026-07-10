# FinanceCity — 3-Week Blog Calendar (21 titles)

Written for the manual Sonnet-5 workflow in [`blog-writer-prompt.md`](./blog-writer-prompt.md).
All titles are new (no overlap with the 13 live posts), long-tail, India-specific, and chosen to
**interlink** with the money pages, screeners, sector pages and existing articles — which is what
builds topical authority on a young site.

## How many per day?

**Recommended: 1 quality post per day** (≈5–7/week). Each post now also needs 2–5 hand-made,
on-theme images plus a human read-through, so 1/day is the sustainable sweet spot that still builds
clusters fast. Over 3 weeks this takes the blog from 13 → **34 posts**.

- Tight on time? **4/week (weekdays)** is still strong.
- **Don't exceed ~2/day**, and **don't dump many at once** — a 3-week-old domain publishing 10
  posts in an hour looks spammy and risks Helpful-Content scrutiny. Publish steadily, ~same time
  each day.
- Quality > volume in YMYL. A great post every day beats five thin ones.

## Week 1 — Fundamentals & first steps

| # | Title | Category | Interlink to |
| --- | --- | --- | --- |
| 1 | How to Read the P/E Ratio of Indian Stocks (With Examples) | investing | `/stocks/low-pe-stocks`, `/blog/how-to-read-price-to-book-ratio-in-indian-stocks`, `/companies` |
| 2 | What Is ROCE and How to Use It for Indian Stocks | investing | `/stocks/high-roe-stocks`, `/blog/return-on-equity-explained-for-indian-stocks-with-examples` |
| 3 | How to Buy Shares in India: A Step-by-Step Beginner's Guide | investing | `/companies`, `/browse`, `/exchange/nse` |
| 4 | What Is a Demat Account and How to Open One in India | investing | `/companies`, `/blog` |
| 5 | Dividend Yield Explained: Finding High-Dividend Indian Stocks | investing | `/stocks/high-dividend-stocks` |
| 6 | Large-Cap vs Mid-Cap vs Small-Cap Stocks in India, Explained | markets | `/stocks/most-valuable-companies`, `/companies` |
| 7 | NSE vs BSE: What's the Difference for Indian Investors? | markets | `/exchange/nse`, `/exchange/bse` |

## Week 2 — Indices, ownership & profitability

| # | Title | Category | Interlink to |
| --- | --- | --- | --- |
| 8 | What Is the Nifty 50 and How Does It Work? | markets | `/blog/how-stocks-are-selected-for-nifty-50-index`, `/blog/what-is-free-float-market-capitalization-in-nifty-50` |
| 9 | What Is the Sensex and How Is It Calculated? | markets | `/exchange/bse`, `/blog` |
| 10 | FII and DII Explained: Who Moves Indian Markets? | markets | `/companies`, `/stocks/top-gainers-today` |
| 11 | How to Read a Company's Shareholding Pattern in India | investing | `/blog/what-is-promoter-pledging-in-indian-stocks-explained`, `/companies` |
| 12 | What Is Free Cash Flow and Why It Matters for Stocks | investing | `/blog/how-to-read-balance-sheet-of-indian-stocks` |
| 13 | Operating Margin vs Net Margin: Reading Profitability | investing | `/stocks/high-growth-stocks`, `/blog/return-on-equity-explained-for-indian-stocks-with-examples` |
| 14 | What Is a Stock Split and How It Affects Your Shares | investing | `/blog/what-is-face-value-of-a-share-in-stock-market-explained` |

## Week 3 — Tax, IPOs, dividends & sectors

| # | Title | Category | Interlink to |
| --- | --- | --- | --- |
| 15 | LTCG and STCG Tax on Shares in India: A Simple Guide | investing | `/companies`, `/blog` |
| 16 | How IPO Allotment Works in India (and How to Improve Your Odds) | markets | `/companies`, `/browse` |
| 17 | What Is Grey Market Premium (GMP) in IPOs? | markets | `/blog`, `/companies` |
| 18 | Bonus Shares vs Stock Split: What's the Difference? | investing | `/blog/what-is-face-value-of-a-share-in-stock-market-explained` |
| 19 | What Is the Dividend Payout Ratio (and a Good Number)? | investing | `/stocks/high-dividend-stocks` |
| 20 | A Beginner's Guide to Indian IT Sector Stocks | companies | `/sector/information-technology`, `/stocks` |
| 21 | Understanding India's Financial Services Sector Stocks | companies | `/sector/financial-services`, `/stocks/high-roe-stocks` |

## Getting each post indexed by Google

1. Commit the `.mdx` + its images → merge to `main` → it auto-appears in `/sitemap.xml`.
2. **Google Search Console → URL Inspection** → paste the new post URL → **Request indexing**.
   (This is the fastest nudge for a brand-new URL on a young site — do it per post.)
3. Once, in GSC → **Sitemaps**, confirm `sitemap.xml` is submitted; Google re-reads it periodically.
4. Bing/Yandex are handled automatically by IndexNow via the cron once `INDEXNOW_KEY` is set —
   but Google does **not** use IndexNow, so the URL-Inspection step above is what matters for Google.
