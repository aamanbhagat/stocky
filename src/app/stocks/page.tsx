import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { SCREENS } from "@/lib/screens";
import { SITE_URL as SITE } from "@/lib/site";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Stock Lists & Screeners — Best NSE & BSE Stocks by Metric",
  description:
    "Curated lists of NSE & BSE stocks — highest dividend yield, highest ROE, debt-free, lowest P/E, top gainers and losers, and the most valuable Indian companies.",
  alternates: { canonical: "/stocks" },
};

export default function StocksHub() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Stock lists & screeners",
    itemListElement: SCREENS.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/stocks/${s.slug}`,
      name: s.label,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="border-b border-rule bg-paper-warm">
        <div className="max-w-[1280px] mx-auto px-6 pt-6 pb-12">
          <Breadcrumb items={[{ href: "/", label: "Home" }, { label: "Stock lists" }]} />
          <h1 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.98] mt-6 text-ink">
            Stock lists &amp; screeners
          </h1>
          <p className="text-mute text-[15px] mt-3 max-w-2xl">
            Ready-made rankings of NSE and BSE listings by the metrics investors screen on —
            dividend yield, return on equity, valuation, growth and daily movers.
          </p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6">
        <AdSlot position="top" />
      </div>

      <section className="max-w-[1280px] mx-auto px-6 py-10 grid md:grid-cols-2 gap-4">
        {SCREENS.map((s) => (
          <Link
            key={s.slug}
            href={`/stocks/${s.slug}`}
            className="block border border-rule p-6 hover:border-ink transition-colors"
          >
            <h2 className="font-display text-[24px] leading-tight text-ink">{s.label}</h2>
            <p className="text-mute text-[14px] mt-2 leading-relaxed">{s.description}</p>
          </Link>
        ))}
      </section>

      <div className="max-w-[1280px] mx-auto px-6">
        <AdSlot position="bottom" />
      </div>
    </>
  );
}
