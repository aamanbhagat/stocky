import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sectorColor } from "@/lib/sectors";
import { slugify } from "@/lib/slug";
import { crFromCr, inr, num, pct, ratio, signedPct, compactDate } from "@/lib/format";
import { companyDescription, companyFaqs, isThinCompany } from "@/lib/copy";
import { getAllPostSlugs } from "@/lib/blog";
import { Breadcrumb } from "@/components/Breadcrumb";
import { MetricCell } from "@/components/MetricCell";
import { Shareholding } from "@/components/Shareholding";
import { MarketPulse } from "@/components/MarketPulse";
import { LivePrice } from "@/components/LivePrice";
import { LiveMetrics } from "@/components/LiveMetrics";
import { LiveMarketCap } from "@/components/LiveMarketCap";
import { LiveQuoteProvider } from "@/components/LiveQuoteProvider";
import { seedQuotes } from "@/lib/liveSeed";
import { CompanyCard } from "@/components/CompanyCard";
import { AdSlot } from "@/components/AdSlot";
import { SITE_URL as SITE, BRAND } from "@/lib/site";

// Weekly ISR
export const revalidate = 86400; // daily — stock data refreshed by the daily cron

export async function generateStaticParams() {
  const top = await prisma.company.findMany({
    where: { marketCap: { not: null } },
    orderBy: { marketCap: "desc" },
    take: 500,
    select: { slug: true },
  });
  return top.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const c = await prisma.company.findUnique({ where: { slug } });
  if (!c) return { title: "Company not found" };

  const ex = c.exchange === "BOTH" ? "NSE & BSE" : c.exchange;
  const asOf = c.pricedAt ? ` (as of ${compactDate(c.pricedAt)})` : "";
  const pricePhrase = c.currentPrice ? `Share price ₹${c.currentPrice.toFixed(2)}${asOf}. ` : "";
  const capPhrase = c.marketCap ? `Market cap ${crFromCr(c.marketCap)}. ` : "";
  const promPhrase =
    c.promoterHolding != null ? `Promoter holding ${c.promoterHolding.toFixed(2)}%. ` : "";

  // "Today" is an evergreen, high-intent modifier for price queries; the visible
  // "Last updated" date on the page carries the actual freshness signal.
  const title = `${c.name} (${c.symbol}) Share Price Today, CIN & Promoters`;
  const description =
    `${c.name} is listed on ${ex}. ` +
    pricePhrase +
    (c.cin ? `CIN: ${c.cin}. ` : "") +
    capPhrase +
    `Sector: ${c.sector ?? "Diversified"}. ` +
    promPhrase +
    `View P/E, ROE, financials, ISIN and shareholding on ${BRAND}.`;

  return {
    title,
    description,
    keywords: [
      `${c.symbol} share price`,
      `${c.name} CIN`,
      `${c.name} promoters`,
      `${c.name} ISIN`,
      `${c.symbol} NSE`,
      `${c.symbol} BSE`,
      `${c.name} financials`,
      c.sector ?? "",
    ].filter(Boolean),
    alternates: {
      canonical: `/companies/${c.slug}`,
      // Indian equities draw a large NRI / foreign-investor audience (Gulf, UK,
      // US) — don't geo-lock to en-IN; expose generic en + x-default too.
      languages: {
        "en-IN": `/companies/${c.slug}`,
        en: `/companies/${c.slug}`,
        "x-default": `/companies/${c.slug}`,
      },
    },
    // Keep genuine junk (non-equity fund rows / empty shells) out of the index
    // so it can't drag site-wide quality; real stock pages stay indexable.
    ...(isThinCompany(c) ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      url: `${SITE}/companies/${c.slug}`,
      title,
      description,
      images: [`/companies/${c.slug}/og`],
    },
    twitter: { card: "summary_large_image", title, description, images: [`/companies/${c.slug}/og`] },
  };
}

export default async function CompanyPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const c = await prisma.company.findUnique({ where: { slug } });
  if (!c) notFound();

  const related = await prisma.company.findMany({
    where: { sector: c.sector, id: { not: c.id }, marketCap: { not: null } },
    orderBy: { marketCap: "desc" },
    take: 6,
  });

  const color = sectorColor(c.sector);
  const exLabel = c.exchange === "BOTH" ? "NSE · BSE" : c.exchange;

  // Seed for the live (client-polled) price + metrics — DB snapshot is the
  // server-rendered baseline, then /api/quote refreshes it during market hours.
  const liveSeed = {
    currentPrice: c.currentPrice,
    dayChange: c.dayChange,
    dayChangePct: c.dayChangePct,
    marketCap: c.marketCap,
    peRatio: c.peRatio,
    pbRatio: c.pbRatio,
    eps: c.eps,
    bookValue: c.bookValue,
    high52: c.high52,
    low52: c.low52,
    dividendYield: c.dividendYield,
  };
  const description = c.longSummary?.trim() || companyDescription(c);
  const faqs = companyFaqs(c);

  // Internal links from every company page into the blog explainer cluster —
  // relevant for readers and a large, topical internal-link boost to those posts.
  // Guarded by which posts actually exist so it never links a 404.
  const postSlugs = new Set(getAllPostSlugs());
  const relatedReading = (
    [
      ["return-on-equity-explained-for-indian-stocks-with-examples", "Return on equity (ROE)"],
      ["how-to-read-debt-to-equity-ratio-in-indian-stocks", "Debt-to-equity ratio"],
      ["how-to-read-price-to-book-ratio-in-indian-stocks", "Price-to-book ratio"],
      ["how-to-read-earnings-per-share-in-indian-stocks", "Earnings per share (EPS)"],
      ["how-to-read-book-value-per-share-in-indian-stocks", "Book value per share"],
      ["what-is-promoter-pledging-in-indian-stocks-explained", "Promoter pledging"],
      ["how-to-read-balance-sheet-of-indian-stocks", "Reading a balance sheet"],
    ] as const
  )
    .filter(([slug]) => postSlugs.has(slug))
    .map(([slug, label]) => ({ href: `/blog/${slug}`, label }));

  const hasFinancials =
    c.revenue != null || c.netProfit != null || c.ebitda != null ||
    c.roe != null || c.debtToEquity != null;
  const hasAnalyst = c.targetPrice != null || c.recommendation != null;
  const upside =
    c.targetPrice != null && c.currentPrice
      ? ((c.targetPrice - c.currentPrice) / c.currentPrice) * 100
      : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Corporation",
        name: c.name,
        legalName: c.name,
        url: c.website || `${SITE}/companies/${c.slug}`,
        identifier: c.cin || c.isin || undefined,
        tickerSymbol: c.symbol,
        isin: c.isin || undefined,
        sameAs: c.website ? [c.website] : undefined,
        numberOfEmployees: c.employees || undefined,
        foundingDate: c.foundedYear ? String(c.foundedYear) : undefined,
        address: c.headquarters
          ? { "@type": "PostalAddress", addressLocality: c.headquarters, addressCountry: "IN" }
          : undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          {
            "@type": "ListItem",
            position: 2,
            name: c.exchange === "BSE" ? "BSE" : "NSE",
            item: `${SITE}/exchange/${c.exchange === "BSE" ? "bse" : "nse"}`,
          },
          c.sector
            ? { "@type": "ListItem", position: 3, name: c.sector, item: `${SITE}/sector/${slugify(c.sector)}` }
            : null,
          {
            "@type": "ListItem",
            position: c.sector ? 4 : 3,
            name: c.name,
            item: `${SITE}/companies/${c.slug}`,
          },
        ].filter(Boolean),
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="border-b border-rule" style={{ background: "var(--color-paper-warm)" }}>
        <div className="max-w-[1280px] mx-auto px-6 pt-6 pb-10">
          <Breadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: `/exchange/${c.exchange === "BSE" ? "bse" : "nse"}`, label: c.exchange === "BSE" ? "BSE" : "NSE" },
              c.sector ? { href: `/sector/${slugify(c.sector)}`, label: c.sector } : null,
              { label: c.symbol },
            ].filter(Boolean) as { href?: string; label: string }[]}
          />

          <header className="mt-7 grid md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-8">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono font-semibold text-[11px] tracking-widest uppercase px-2 py-1 border-2" style={{ borderColor: color, color }}>
                  {c.sector ?? "Diversified"}
                </span>
                <span className="font-mono font-semibold text-[11px] tracking-widest uppercase px-2 py-1 bg-ink text-paper">
                  {exLabel}
                </span>
              </div>
              <h1 className="font-display text-[clamp(40px,6vw,68px)] leading-[0.98] mt-4 text-ink">
                {c.name}
              </h1>
              <p className="font-mono font-semibold text-[15px] tnum text-ink-2 mt-3">
                <span className="text-saffron-dim">{c.symbol}</span>
                {c.isin && <> · ISIN {c.isin}</>}
                {c.cin && <> · CIN {c.cin}</>}
              </p>
              {c.currentPrice != null && (
                <div className="mt-5">
                  <p className="eyebrow mb-1">Share price</p>
                  <LivePrice symbol={c.yahooSymbol} seed={liveSeed} />
                  {c.pricedAt && (
                    <p className="text-[12px] text-mute-2 mt-2">
                      Last updated {compactDate(c.pricedAt)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-4 md:border-l md:border-rule md:pl-8">
              <p className="eyebrow">Market capitalisation</p>
              <div className="mt-2">
                <MarketPulse>
                  <LiveMarketCap symbol={c.yahooSymbol} seed={liveSeed} />
                </MarketPulse>
              </div>
              <p className="text-[12px] text-mute-2 mt-3 max-w-[260px]">
                Live from Yahoo Finance. Pulse animates during NSE market hours
                (9:15–15:30 IST, weekdays).
              </p>
            </div>
          </header>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6">
        <AdSlot position="top" />
      </div>

      {/* KEY METRICS */}
      <section className="max-w-[1280px] mx-auto px-6 pt-4 pb-12">
        <p className="eyebrow">01 · Key metrics</p>
        <LiveMetrics symbol={c.yahooSymbol} seed={liveSeed} />
      </section>

      {/* PER SHARE & RETURNS */}
      <section className="max-w-[1280px] mx-auto px-6 pb-12">
        <p className="eyebrow">02 · Per share &amp; returns</p>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCell label="EPS (TTM)" value={c.eps != null ? inr(c.eps) : "—"} />
          <MetricCell label="Book value" value={c.bookValue != null ? inr(c.bookValue) : "—"} />
          <MetricCell label="ROE" value={pct(c.roe)} accent={!!c.roe && c.roe >= 15} />
          <MetricCell label="ROA" value={pct(c.roa)} />
          <MetricCell label="Dividend yield" value={pct(c.dividendYield)} />
          <MetricCell label="Beta" value={num(c.beta)} />
        </div>
      </section>

      {/* FINANCIALS */}
      {hasFinancials && (
        <section className="max-w-[1280px] mx-auto px-6 pb-12">
          <p className="eyebrow">03 · Financials (TTM)</p>
          <h2 className="font-display text-[32px] leading-tight mt-1 mb-5">By the numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCell label="Revenue" value={c.revenue != null ? crFromCr(c.revenue) : "—"} hint={c.revenueGrowth != null ? signedPct(c.revenueGrowth) + " YoY" : undefined} />
            <MetricCell label="EBITDA" value={c.ebitda != null ? crFromCr(c.ebitda) : "—"} />
            <MetricCell label="Net profit" value={c.netProfit != null ? crFromCr(c.netProfit) : "—"} hint={c.earningsGrowth != null ? signedPct(c.earningsGrowth) + " YoY" : undefined} />
            <MetricCell label="Profit margin" value={pct(c.profitMargin)} />
            <MetricCell label="Operating margin" value={pct(c.operatingMargin)} />
            <MetricCell label="Total debt" value={c.totalDebt != null ? crFromCr(c.totalDebt) : "—"} />
            <MetricCell label="Total cash" value={c.totalCash != null ? crFromCr(c.totalCash) : "—"} />
            <MetricCell label="Debt / equity" value={ratio(c.debtToEquity)} />
            <MetricCell label="Current ratio" value={ratio(c.currentRatio)} />
            <MetricCell label="Payout ratio" value={pct(c.payoutRatio)} />
          </div>
        </section>
      )}

      {/* ANALYST */}
      {hasAnalyst && (
        <section className="max-w-[1280px] mx-auto px-6 pb-12">
          <p className="eyebrow">04 · Analyst view</p>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCell label="Target price" value={c.targetPrice != null ? inr(c.targetPrice) : "—"} accent />
            <MetricCell label="Upside" value={upside != null ? signedPct(upside) : "—"} />
            <MetricCell label="Consensus" value={c.recommendation ? c.recommendation.replace(/_/g, " ").toUpperCase() : "—"} />
            <MetricCell label="Analysts" value={c.analystCount != null ? String(c.analystCount) : "—"} />
          </div>
        </section>
      )}

      <div className="max-w-[1280px] mx-auto px-6">
        <AdSlot position="mid" />
      </div>

      {/* SHAREHOLDING + REGISTRATION */}
      <section className="max-w-[1280px] mx-auto px-6 py-14 border-t border-rule">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            <p className="eyebrow">05 · Shareholding pattern</p>
            <h2 className="font-display text-[32px] leading-tight mt-1 mb-6">Who owns {c.symbol}?</h2>
            <Shareholding
              pattern={{
                promoter: c.promoterHolding,
                institutional: c.institutionalHolding,
                public: c.publicHolding,
                asOf: c.shareholdingDate,
                source: c.shareholdingSrc,
              }}
            />
          </div>
          <div className="lg:col-span-5 lg:border-l lg:border-rule lg:pl-10">
            <p className="eyebrow">06 · Registration &amp; listing</p>
            <h2 className="font-display text-[32px] leading-tight mt-1 mb-6">On the record</h2>
            <dl className="divide-y divide-rule text-[14px]">
              <Row label="Symbol" value={c.symbol} mono />
              <Row label="Exchange" value={exLabel} />
              <Row label="CIN" value={c.cin ?? "—"} mono />
              <Row label="ISIN" value={c.isin ?? "—"} mono />
              <Row label="BSE code" value={c.bseCode ?? "—"} mono />
              <Row label="Sector" value={c.sector ?? "—"} />
              <Row label="Industry" value={c.industry ?? "—"} />
              <Row label="Face value" value={c.faceValue != null ? `₹${c.faceValue}` : "—"} mono />
              <Row label="Listing date" value={compactDate(c.listingDate)} />
              <Row label="Employees" value={c.employees != null ? c.employees.toLocaleString("en-IN") : "—"} mono />
              <Row label="Headquarters" value={c.headquarters ?? "—"} />
              <Row
                label="Website"
                value={c.website ? (
                  <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-saffron-dim hover:underline">
                    {c.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : "—"}
              />
            </dl>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="max-w-[1280px] mx-auto px-6 py-14 border-t border-rule">
        <p className="eyebrow">07 · About</p>
        <h2 className="font-display text-[36px] leading-tight mt-1 mb-6 max-w-3xl">What is {c.name}?</h2>
        <div className="text-[16px] text-ink-soft leading-[1.7] max-w-3xl whitespace-pre-wrap">
          {description}
        </div>
        {relatedReading.length > 0 && (
          <div className="mt-8 flex flex-wrap items-baseline gap-x-5 gap-y-2 text-[14px]">
            <span className="text-mute-2 uppercase tracking-wider text-[12px] font-semibold">
              Learn the metrics
            </span>
            {relatedReading.map((r) => (
              <Link key={r.href} href={r.href} className="text-saffron-dim hover:underline">
                {r.label}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="max-w-[1280px] mx-auto px-6 py-14 border-t border-rule">
        <p className="eyebrow">08 · Common questions</p>
        <h2 className="font-display text-[32px] leading-tight mt-1 mb-6">Frequently asked</h2>
        <div className="divide-y divide-rule border-y border-rule">
          {faqs.map((f) => (
            <details key={f.q} className="py-5 group">
              <summary className="cursor-pointer flex items-center justify-between gap-6 list-none">
                <span className="font-display text-[20px] text-ink">{f.q}</span>
                <span className="font-mono font-semibold text-saffron-dim group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-[15px] text-mute leading-relaxed max-w-3xl">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-6 py-14 border-t border-rule">
          <header className="flex items-end justify-between gap-6 mb-6 flex-wrap">
            <div>
              <p className="eyebrow">09 · Adjacent</p>
              <h2 className="font-display text-[32px] leading-tight mt-1">Other {c.sector?.toLowerCase()} listings</h2>
            </div>
            {c.sector && (
              <Link href={`/sector/${slugify(c.sector)}`} className="font-mono font-semibold text-[12px] tracking-widest uppercase border-b-2 border-ink hover:border-saffron hover:text-saffron-dim">
                Full sector →
              </Link>
            )}
          </header>
          <LiveQuoteProvider seed={seedQuotes(related)}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {related.map((r) => <CompanyCard key={r.id} c={r} />)}
            </div>
          </LiveQuoteProvider>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2 text-[14px]">
            <span className="text-mute-2 uppercase tracking-wider text-[12px] font-semibold">
              Compare {c.symbol} with
            </span>
            {related.slice(0, 4).map((r) => (
              <Link
                key={r.id}
                href={`/compare/${[c.slug, r.slug].sort().join("-vs-")}`}
                className="text-saffron-dim hover:underline"
              >
                {r.symbol}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="max-w-[1280px] mx-auto px-6">
        <AdSlot position="bottom" />
      </div>
    </>
  );
}

function Row({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <dt className="text-mute-2 text-[12px] uppercase tracking-wider font-semibold">{label}</dt>
      <dd className={`text-ink ${mono ? "font-mono font-semibold tnum text-[13px]" : "text-[14px] font-semibold"} text-right`}>
        {value}
      </dd>
    </div>
  );
}
