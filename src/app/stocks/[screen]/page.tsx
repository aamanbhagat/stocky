import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sectorColor } from "@/lib/sectors";
import { SCREENS, getScreen } from "@/lib/screens";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { LiveQuoteProvider } from "@/components/LiveQuoteProvider";
import { LiveCap } from "@/components/LiveCap";
import { seedQuotes } from "@/lib/liveSeed";
import { SITE_URL as SITE } from "@/lib/site";

export const revalidate = 3600;

export function generateStaticParams() {
  return SCREENS.map((s) => ({ screen: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ screen: string }>;
}): Promise<Metadata> {
  const { screen } = await params;
  const def = getScreen(screen);
  if (!def) return { title: "Screen not found", robots: { index: false } };
  return {
    title: def.title,
    description: def.description,
    alternates: { canonical: `/stocks/${def.slug}` },
  };
}

export default async function ScreenPage({
  params,
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;
  const def = getScreen(screen);
  if (!def) notFound();

  const rows = await prisma.company.findMany({
    where: def.where,
    orderBy: def.orderBy,
    take: 100,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Stock lists", item: `${SITE}/stocks` },
          { "@type": "ListItem", position: 3, name: def.label, item: `${SITE}/stocks/${def.slug}` },
        ],
      },
      {
        "@type": "ItemList",
        name: def.title,
        numberOfItems: rows.length,
        itemListElement: rows.slice(0, 50).map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE}/companies/${c.slug}`,
          name: c.name,
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="border-b border-rule bg-paper-warm">
        <div className="max-w-[1280px] mx-auto px-6 pt-6 pb-12">
          <Breadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/stocks", label: "Stock lists" },
              { label: def.label },
            ]}
          />
          <h1 className="font-display text-[clamp(36px,5vw,60px)] leading-[1.0] mt-6 text-ink">
            {def.label}
          </h1>
          <p className="text-mute text-[15px] mt-4 max-w-3xl leading-relaxed">{def.intro}</p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6">
        <AdSlot position="top" />
      </div>

      <section className="max-w-[1280px] mx-auto px-6 pb-16">
        {rows.length === 0 ? (
          <p className="py-12 text-center text-mute">No companies currently match this screen.</p>
        ) : (
          <LiveQuoteProvider seed={seedQuotes(rows)}>
            <div className="border-t border-b border-ink divide-y divide-rule">
              <div className="grid grid-cols-12 gap-3 py-2 px-3 eyebrow">
                <span className="col-span-2">Symbol</span>
                <span className="col-span-5">Company</span>
                <span className="col-span-2 text-right">Market cap</span>
                <span className="col-span-3 text-right">{def.metricLabel}</span>
              </div>
              {rows.map((c) => (
                <Link
                  href={`/companies/${c.slug}`}
                  key={c.id}
                  className="grid grid-cols-12 gap-3 items-baseline py-3 px-3 row-hover relative"
                >
                  <span
                    className="absolute left-0 top-0 bottom-0 w-[2px]"
                    style={{ background: sectorColor(c.sector) }}
                  />
                  <span className="col-span-2 font-mono text-[12px] text-ink-2">{c.symbol}</span>
                  <span className="col-span-5 font-display text-[17px] text-ink truncate">{c.name}</span>
                  <span className="col-span-2 text-right font-mono text-[12px] tnum text-mute-2">
                    <LiveCap symbol={c.yahooSymbol} seed={c.marketCap} />
                  </span>
                  <span className="col-span-3 text-right font-mono text-[13px] tnum text-ink font-semibold">
                    {def.metric(c)}
                  </span>
                </Link>
              ))}
            </div>
          </LiveQuoteProvider>
        )}

        <div className="mt-10">
          <p className="eyebrow mb-3">More stock lists</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
            {SCREENS.filter((s) => s.slug !== def.slug).map((s) => (
              <Link key={s.slug} href={`/stocks/${s.slug}`} className="text-saffron-dim hover:underline">
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-6">
        <AdSlot position="bottom" />
      </div>
    </>
  );
}
