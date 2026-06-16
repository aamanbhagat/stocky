import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SECTORS, sectorColor } from "@/lib/sectors";
import { slugify } from "@/lib/slug";
import { crFromCr } from "@/lib/format";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { SITE_URL as SITE } from "@/lib/site";

export const revalidate = 604800;

export async function generateStaticParams() {
  return SECTORS.map((s) => ({ sector: slugify(s) }));
}

function resolveSector(slug: string): string | null {
  return SECTORS.find((s) => slugify(s) === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sector: string }>;
}): Promise<Metadata> {
  const { sector: raw } = await params;
  const sector = resolveSector(raw);
  if (!sector) return { title: "Sector not found" };
  return {
    title: `${sector} — NSE & BSE listed companies`,
    description: `Every NSE and BSE listed company in the ${sector} sector. Browse symbols, CIN, ISIN, market cap and promoter holding on FinanceCity.`,
    alternates: { canonical: `/sector/${raw}` },
  };
}

export default async function SectorPage({
  params,
}: {
  params: Promise<{ sector: string }>;
}) {
  const { sector: raw } = await params;
  const sector = resolveSector(raw);
  if (!sector) notFound();

  const [rows, agg] = await Promise.all([
    prisma.company.findMany({
      where: { sector },
      orderBy: [{ marketCap: { sort: "desc", nulls: "last" } }, { name: "asc" }],
      take: 500,
    }),
    prisma.company.aggregate({
      where: { sector },
      _sum: { marketCap: true },
      _count: { _all: true },
    }),
  ]);

  const color = sectorColor(sector);
  const total = agg._count._all;
  const totalCap = agg._sum.marketCap ?? 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: sector, item: `${SITE}/sector/${raw}` },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `${sector} companies on NSE & BSE`,
        url: `${SITE}/sector/${raw}`,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: total,
          itemListElement: rows.slice(0, 50).map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE}/companies/${c.slug}`,
            name: c.name,
          })),
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="border-b border-rule bg-paper-warm">
        <div className="max-w-[1280px] mx-auto px-6 pt-6 pb-12">
          <Breadcrumb
            items={[{ href: "/", label: "Home" }, { label: "Sector" }, { label: sector }]}
          />
          <div className="mt-6 flex items-end gap-8 flex-wrap">
            <div className="min-w-0 flex-1">
              <span
                className="inline-block font-mono text-[11px] tracking-widest uppercase px-2 py-1 border"
                style={{ borderColor: color, color }}
              >
                Sector
              </span>
              <h1 className="font-display text-[clamp(40px,5vw,68px)] leading-[0.98] mt-3 text-ink">
                {sector}
              </h1>
            </div>
            <dl className="grid grid-cols-2 gap-x-10 gap-y-2 shrink-0">
              <div>
                <dt className="eyebrow">Listings</dt>
                <dd className="font-mono tnum text-[26px] mt-1 text-ink leading-none">
                  {total.toLocaleString("en-IN")}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Sector market cap</dt>
                <dd className="font-mono tnum text-[26px] mt-1 text-ink leading-none">
                  {crFromCr(totalCap)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6">
        <AdSlot position="top" />
      </div>

      <section className="max-w-[1280px] mx-auto px-6 pb-16">
        <div className="border-t border-b border-ink divide-y divide-rule">
          {rows.map((c) => (
            <Link
              href={`/companies/${c.slug}`}
              key={c.id}
              className="grid grid-cols-12 gap-3 items-baseline py-3 px-3 row-hover relative"
            >
              <span className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: color }} />
              <span className="col-span-2 font-mono text-[12px] text-ink-2">{c.symbol}</span>
              <span className="col-span-6 font-display text-[17px] text-ink truncate">{c.name}</span>
              <span className="col-span-2 text-[12px] text-mute-2">{c.exchange}</span>
              <span className="col-span-2 text-right font-mono text-[12px] tnum text-ink">
                {c.marketCap ? crFromCr(c.marketCap) : "—"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-6">
        <AdSlot position="bottom" />
      </div>
    </>
  );
}
