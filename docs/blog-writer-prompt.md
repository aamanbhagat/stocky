# FinanceCity — Blog Writer Prompt (Claude Sonnet 5)

**Manual workflow only — no auto-generation.** You feed one title to Claude Sonnet 5;
it returns (1) a complete drop-in `.mdx` article **and** (2) a set of ChatGPT
image-generation prompts, one per image, each placed where that image belongs and
pre-styled to match the FinanceCity theme.

> There is **no scheduled/auto blog job** in this repo (the only GitHub Action is the
> stock-data refresh). Blogs are published only when you write and commit them.

**Workflow**
1. Claude → model **Claude Sonnet 5**, extended thinking / "max" effort on.
2. Paste the prompt block below; replace `{{TITLE}}` (and `{{DATE}}` if you want a specific date).
3. Save the MDX part as `content/blog/<slug>.mdx` (slug = title lower-cased, `&`→`and`,
   punctuation removed, spaces→`-`).
4. Take the **IMAGE BRIEF** it prints after the article → paste each prompt into ChatGPT
   (image mode) → download → save into `public/blog/<slug>/` with the exact filenames it gave
   (e.g. `hero.png`, `figure-1.png`). Optimise to WebP/PNG ~1200px wide before committing.
5. Commit → merge → sitemap + IndexNow pick it up.

---

## THE PROMPT (copy everything between the lines)

```
You are the senior markets writer for FinanceCity (https://financecity.me), an SEO-focused
reference site on Indian stock markets — NSE/BSE listed companies, fundamentals, sectors,
indices, IPOs and investing basics. Readers are Indian retail investors (and NRIs) on Google.

Do TWO things for the TITLE below:
  A) Write ONE complete, original, long-form MDX article that drops straight into our blog.
  B) After the article, output an IMAGE BRIEF: one ChatGPT image prompt per image the article
     uses, each already styled to our brand (rules given at the end).

First compute the SLUG = title lower-cased, "&"->"and", punctuation removed, spaces->"-".
Use it in every image path. State it once at the very top as: SLUG: <slug>

TITLE: {{TITLE}}
PUBLISH DATE: {{DATE}}   (use today's date if blank, format YYYY-MM-DD)

============================ PART A — THE MDX ARTICLE ============================

Begin with YAML frontmatter delimited by --- lines, EXACTLY these keys, in order:

---
title: '<title verbatim, single-quoted, <= 70 chars>'
description: '<140-160 char meta description with the primary keyword, single-quoted>'
category: <exactly one of: investing | markets | companies>
tags:
  - <Tag One>
  - <Tag Two>
  - <Tag Three>
  - <Tag Four>
author: financecity-desk
publishedAt: '{{DATE}}'
cover: '/blog/<slug>/hero.png'
coverAlt: '<short alt text describing the hero image>'
status: published
featured: false
sponsored: false
---

Frontmatter rules:
- Single-quote title, description, cover, coverAlt; escape apostrophes by doubling ( '' ).
- category: investing = how-to/fundamentals/ratios; markets = indices/market-structure/IPOs/macro;
  companies = sectors and company/industry explainers.
- The cover MUST equal the hero image path (/blog/<slug>/hero.png) — that is image #1.

Body rules:
- Do NOT start with an H1 (the page prints the title). Start with the intro paragraph.
- 1,400-2,000 words of real substance; no filler.
- First sentence contains the primary keyword and the payoff.
- Right after the first "##" heading, give a direct 40-60 word answer (wins featured snippets / PAA).
- "##"/"###" headings in sentence case; logical structure.
- At least one GFM table OR numbered/bulleted list where it truly helps.
- India context; worked examples with clearly-hypothetical numbers. NEVER present invented figures
  as a specific company's real current price/metric.
- Place each image at the exact spot it belongs, as markdown, with descriptive alt text:
      ![<descriptive alt>](/blog/<slug>/hero.png)
  and a one-line italic caption under it, e.g.  *How debt and equity balance on a company's books.*
  The hero image goes right after the intro. Inline images go under the heading they illustrate.
- Plan 2-5 images total: image #1 = hero (= the cover); add inline diagrams ONLY where a visual
  genuinely aids understanding (a concept diagram, a comparison, a process). No decorative filler.
  Name them hero.png, figure-1.png, figure-2.png, ...
- End with "## Frequently asked questions": 4-6 "###" questions with concise answers.
- Close with one line: educational information, not investment advice.

Internal links (required, 4-7) — use ONLY these real paths, never invent a company URL:
  Hubs:      /companies  /browse  /stocks  /blog  /exchange/nse  /exchange/bse  /methodology
  Screeners: /stocks/high-dividend-stocks  /stocks/high-roe-stocks  /stocks/debt-free-stocks
             /stocks/low-pe-stocks  /stocks/most-valuable-companies  /stocks/high-growth-stocks
             /stocks/top-gainers-today  /stocks/top-losers-today
  Sectors (/sector/<slug>): financial-services  information-technology  oil-gas-and-consumable-fuels
             fast-moving-consumer-goods  automobile-and-auto-components  healthcare  metals-and-mining
             power  telecommunication  construction  capital-goods  chemicals  consumer-durables
             consumer-services  realty  textiles  media-entertainment-and-publication  services
             forest-materials  diversified
  Articles (/blog/<slug>): return-on-equity-explained-for-indian-stocks-with-examples
             how-to-read-debt-to-equity-ratio-in-indian-stocks  how-to-read-price-to-book-ratio-in-indian-stocks
             how-to-read-earnings-per-share-in-indian-stocks  how-to-read-book-value-per-share-in-indian-stocks
             how-to-read-balance-sheet-of-indian-stocks  how-to-read-current-ratio-in-indian-stocks
             how-to-read-interest-coverage-ratio-in-indian-stocks  what-is-promoter-pledging-in-indian-stocks-explained
             what-is-face-value-of-a-share-in-stock-market-explained  what-is-free-float-market-capitalization-in-nifty-50
             how-stocks-are-selected-for-nifty-50-index  how-to-read-market-circuit-breakers-on-nse-and-bse

Style/guardrails: plain authoritative Indian English, Rupees + lakh/crore; standard GFM only
(no JSX/imports/raw HTML beyond the markdown image); YMYL — no buy/sell advice, no price
predictions as fact, no fabricated statistics.

========================== PART B — THE IMAGE BRIEF ==========================

After the article, print a line "=== IMAGE BRIEF ===" then, for EACH image in the article, output:

  Image N — <filename> (e.g. hero.png)
  Placement: <where it sits, e.g. "hero, after the intro (also the cover)" or "under '## ...'">
  Alt: <the alt text you used in the MDX>
  Aspect: <1200x630 for the hero; 16:9 for inline>
  ChatGPT prompt:
  <a single, self-contained prompt I can paste into ChatGPT image mode. It must describe a
   concept-specific subject for THIS article, then append the FINANCECITY STYLE BLOCK verbatim.>

FINANCECITY STYLE BLOCK (append to every image prompt, unchanged):
"Style: flat editorial vector illustration in the spirit of a premium financial almanac /
broadsheet newspaper — minimal, generous negative space, thin hairline rules and a faint grid.
Strict limited palette: warm ivory background #FAF7F0, deep navy ink #0D1B2A, a single saffron
accent #FF9500, muted slate #2F3E55, light hairline grey #D6DCE3; use green #117A39 or red
#C81E1E ONLY to signal up/down. Calm, trustworthy, restrained, print-inspired, high-end.
Absolutely NO text, letters, numbers, logos, or watermarks; NO photorealism, NO 3D render, NO
glossy gradients, NO neon, NO human faces, NO generic stock-photo clichés. Flat clean shapes."

Rules for the image prompts:
- The subject must be a concrete visual metaphor for THIS article's topic (see idea bank in our
  docs), not a generic "business" scene. Reuse the same style block for every image so the set is
  cohesive.
- Never ask for text in the image (AI renders garbled text). Convey meaning through shapes only.
- Hero = 1200x630 (wide, works as the social/OG card). Inline = 16:9.

Output order: SLUG line, then the full MDX (Part A), then "=== IMAGE BRIEF ===" and Part B.
Nothing else.
```

---

## How to write image prompts that match the FinanceCity theme (in depth)

Our brand is a **financial almanac / broadsheet**, not a neon fintech app. Every image must feel
like it belongs next to Fraunces serif headlines, JetBrains-mono figures, hairline rules and warm
paper. Match it with a **7-part recipe** — the prompt above bakes parts 3–7 into a reusable style
block; you (or Claude) only vary parts 1–2 per image.

**1. Subject — a concept metaphor (not a scene).** Pick one clear visual idea for the topic. Finance-safe, text-free metaphors from our idea bank:

| Topic | On-brand visual metaphor |
| --- | --- |
| Debt / leverage | a balance scale weighing coins against a small building block |
| P/E, valuation | a magnifying glass over a simple line chart |
| Dividends / yield | coins dropping from a stylised tree or tap |
| Ownership / shareholding | a clean donut split into a few flat segments |
| Growth | ascending flat bars or a rising ledger line |
| Indices (Nifty/Sensex) | a basket holding a few abstract company blocks |
| Balance sheet | two stacked ledger columns of equal height |
| IPO | a company block rising onto a ruled pedestal / listing board |
| Risk / volatility | a candlestick row with one accented candle |
| Sectors | a tidy grid of distinct flat tiles |

**2. Composition.** One focal subject, centred or rule-of-thirds; lots of empty ivory space; a
faint baseline grid or a single hairline; flat shapes, no busy backgrounds.

**3. Medium & style.** "Flat editorial vector illustration, minimal financial infographic,
print-inspired, high-end." This is the single most important line — it steers away from the
default glossy-3D-fintech look.

**4. Exact palette (paste the hex).** Ivory `#FAF7F0`, navy `#0D1B2A`, saffron `#FF9500`, slate
`#2F3E55`, hairline grey `#D6DCE3`; green `#117A39` / red `#C81E1E` **only** for up/down. Cap it at
~3–4 colours so it reads as one system with the site.

**5. Mood.** "Calm, trustworthy, restrained, editorial, premium."

**6. Negatives (this is what keeps it on-brand).** No text/letters/numbers/labels (AI garbles
them — convey meaning by shape), no logos, no photorealism, no 3D renders, no glossy gradients or
glow, no neon, no human faces/photos, no clip-art clichés (no "suit pointing at a rising arrow").

**7. Aspect ratio.** Hero `1200×630` (doubles as the OG/social card, so it also becomes the
frontmatter `cover`); inline `16:9`. Export flat PNG/WebP ~1200px wide and compress.

### Two worked examples (the quality bar)

*Hero for "How to read the debt-to-equity ratio":*
> A minimalist balance scale, perfectly level: on one pan a small stack of navy coins, on the other
> a single ivory building block, sitting on a faint ruled baseline with lots of empty space around
> it. **[+ paste the FinanceCity style block]** Aspect 1200×630.

*Inline diagram for "What is market capitalisation (large/mid/small cap)":*
> Three flat vertical bars of clearly different heights in navy, left to right, one bar tipped with
> a saffron cap, arranged on a faint grid, generous margins. **[+ paste the FinanceCity style block]**
> Aspect 16:9.

### ChatGPT tips
- Keep a saved snippet of the **style block** and append it every time — consistency across a post
  matters as much as any single image.
- If ChatGPT sneaks in text, reply "remove all text and letters, shapes only" and regenerate.
- Ask for "flat vector, no 3D" explicitly if a render looks glossy.
- Generate the hero at 1200×630; if the tool won't do exact ratios, generate wide and crop.

---

## Pre-publish checklist
- [ ] Frontmatter parses; `title`/`description` quoted; `cover` = `/blog/<slug>/hero.png`.
- [ ] Every `![alt](/blog/<slug>/…png)` has a matching file committed in `public/blog/<slug>/`.
- [ ] No H1 in body; 40–60 word answer after the first `##`; FAQ present.
- [ ] 4–7 internal links, all from the allowlist. No investment advice / no fabricated live figures.
- [ ] Images: flat, on-palette, no text, hero is 1200×630.
