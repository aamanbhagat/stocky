import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import type { Company } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { inr, pct, ratio, crFromCr } from "@/lib/format";
import { canonicalPair, parsePair, seededComparePairs } from "@/lib/compare";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { SITE_URL as SITE } from "@/lib/site";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const pairs = await seededComparePairs();
  return pairs.map((pair) => ({ pair }));
}

async function loadPair(pair: string): Promise<{ a: Company; b: Company } | null> {
  const parsed = parsePair(pair);
  if (!parsed) return null;
  const [sa, sb] = parsed;
  const [a, b] = await Promise.all([
    prisma.company.findUnique({ where: { slug: sa } }),
    prisma.company.findUnique({ where: { slug: sb } }),
  ]);
  if (!a || !b) return null;
  return { a, b };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const found = await loadPair(pair);
  if (!found) return { title: "Comparison not found", robots: { index: false } };
  const { a, b } = found;
  const title = `${a.name} vs ${b.name} — Share Price & Financials Compared`;
  return {
    title,
    description: `Compare ${a.name} (${a.symbol}) and ${b.name} (${b.symbol}) side by side — share price, market cap, P/E, ROE, dividend yield, debt and promoter holding on the NSE & BSE.`,
    alternates: { canonical: `/compare/${canonicalPair(a.slug, b.slug)}` },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const found = await loadPair(pair);
  if (!found) notFound();
  const { a, b } = found;

  const metrics: Array<{ label: string; a: string; b: string }> = [
    { label: "Share price", a: inr(a.currentPrice), b: inr(b.currentPrice) },
    { label: "Market cap", a: crFromCr(a.marketCap), b: crFromCr(b.marketCap) },
    { label: "P/E ratio", a: ratio(a.peRatio), b: ratio(b.peRatio) },
    { label: "P/B ratio", a: ratio(a.pbRatio), b: ratio(b.pbRatio) },
    { label: "ROE", a: pct(a.roe), b: pct(b.roe) },
    { label: "EPS (TTM)", a: inr(a.eps), b: inr(b.eps) },
    { label: "Dividend yield", a: pct(a.dividendYield), b: pct(b.dividendYield) },
    { label: "Debt / equity", a: ratio(a.debtToEquity), b: ratio(b.debtToEquity) },
    { label: "Revenue", a: crFromCr(a.revenue), b: crFromCr(b.revenue) },
    { label: "Net profit", a: crFromCr(a.netProfit), b: crFromCr(b.netProfit) },
    {
      label: "Promoter holding",
      a: a.promoterHolding != null ? pct(a.promoterHolding) : "—",
      b: b.promoterHolding != null ? pct(b.promoterHolding) : "—",
    },
  ];

  const faqs: Array<{ q: string; a: string }> = [];
  if (a.marketCap != null && b.marketCap != null) {
    const bigger = a.marketCap >= b.marketCap ? a : b;
    const smaller = bigger === a ? b : a;
    faqs.push({
      q: `Which is bigger, ${a.name} or ${b.name}?`,
      a: `${bigger.name} is the larger company by market capitalisation — about ${crFromCr(bigger.marketCap)} versus ${crFromCr(smaller.marketCap)} for ${smaller.name}.`,
    });
  }
  if (a.peRatio != null && a.peRatio > 0 && b.peRatio != null && b.peRatio > 0) {
    const cheaper = a.peRatio <= b.peRatio ? a : b;
    faqs.push({
      q: `Which is cheaper by P/E, ${a.symbol} or ${b.symbol}?`,
      a: `${cheaper.name} trades on the lower price-to-earnings ratio (${ratio(cheaper.peRatio)} vs ${ratio(cheaper === a ? b.peRatio : a.peRatio)}), though a lower P/E can reflect slower expected growth.`,
    });
  }
  if (a.dividendYield != null && b.dividendYield != null) {
    const higher = (a.dividendYield ?? 0) >= (b.dividendYield ?? 0) ? a : b;
    faqs.push({
      q: `Which pays a higher dividend, ${a.name} or ${b.name}?`,
      a: `${higher.name} currently shows the higher trailing dividend yield (${pct(higher.dividendYield)}).`,
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Compare", item: `${SITE}/compare/${canonicalPair(a.slug, b.slug)}` },
        ],
      },
      ...(faqs.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="border-b border-rule bg-paper-warm">
        <div className="max-w-[1080px] mx-auto px-6 pt-6 pb-12">
          <Breadcrumb items={[{ href: "/", label: "Home" }, { label: "Compare" }]} />
          <h1 className="font-display text-[clamp(30px,4.5vw,52px)] leading-[1.02] mt-6 text-ink">
            {a.name} <span className="text-saffron-dim">vs</span> {b.name}
          </h1>
          <p className="text-mute text-[15px] mt-4 max-w-3xl leading-relaxed">
            A side-by-side comparison of{" "}
            <Link href={`/companies/${a.slug}`} className="text-saffron-dim hover:underline">
              {a.symbol}
            </Link>{" "}
            and{" "}
            <Link href={`/companies/${b.slug}`} className="text-saffron-dim hover:underline">
              {b.symbol}
            </Link>{" "}
            on the metrics that matter — size, valuation, profitability, leverage and ownership.
            Figures reflect the latest data refresh; always confirm against company filings.
          </p>
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto px-6">
        <AdSlot position="top" />
      </div>

      <section className="max-w-[1080px] mx-auto px-6 py-10">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th className="py-3 pr-4 font-semibold text-mute-2 uppercase tracking-wider text-[12px]">
                  Metric
                </th>
                <th className="py-3 px-4 font-display text-[17px] text-ink">
                  <Link href={`/companies/${a.slug}`} className="hover:text-saffron-dim">
                    {a.symbol}
                  </Link>
                </th>
                <th className="py-3 pl-4 font-display text-[17px] text-ink">
                  <Link href={`/companies/${b.slug}`} className="hover:text-saffron-dim">
                    {b.symbol}
                  </Link>
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.label} className="border-b border-rule">
                  <td className="py-3 pr-4 text-mute-2">{m.label}</td>
                  <td className="py-3 px-4 font-mono tnum text-ink">{m.a}</td>
                  <td className="py-3 pl-4 font-mono tnum text-ink">{m.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="max-w-[1080px] mx-auto px-6 pb-14">
          <p className="eyebrow">Common questions</p>
          <div className="divide-y divide-rule border-y border-rule mt-4">
            {faqs.map((f) => (
              <details key={f.q} className="py-5 group">
                <summary className="cursor-pointer flex items-center justify-between gap-6 list-none">
                  <span className="font-display text-[19px] text-ink">{f.q}</span>
                  <span className="font-mono font-semibold text-saffron-dim group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[15px] text-mute leading-relaxed max-w-3xl">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <div className="max-w-[1080px] mx-auto px-6">
        <AdSlot position="bottom" />
      </div>
    </>
  );
}
