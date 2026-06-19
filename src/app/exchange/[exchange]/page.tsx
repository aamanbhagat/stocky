import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sectorColor } from "@/lib/sectors";
import { crFromCr } from "@/lib/format";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { SITE_URL as SITE } from "@/lib/site";

export const revalidate = 86400; // daily — stock data refreshed by the daily cron

export function generateStaticParams() {
  return [{ exchange: "nse" }, { exchange: "bse" }];
}

const VALID = new Set(["nse", "bse"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ exchange: string }>;
}): Promise<Metadata> {
  const { exchange } = await params;
  if (!VALID.has(exchange)) return { title: "Not found" };
  const name = exchange.toUpperCase();
  return {
    title: `${name} Listed Companies — Complete Directory`,
    description: `Every active equity listing on the ${name}. Symbols, CIN, ISIN, sector, market cap. Updated weekly from official exchange archives.`,
    alternates: { canonical: `/exchange/${exchange}` },
  };
}

export default async function ExchangePage({
  params,
  searchParams,
}: {
  params: Promise<{ exchange: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { exchange } = await params;
  if (!VALID.has(exchange)) notFound();
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const PER = 100;

  const where: Prisma.CompanyWhereInput = {
    exchange: exchange === "nse" ? { in: ["NSE", "BOTH"] } : { in: ["BSE", "BOTH"] },
  };

  const [total, rows, capAgg] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      orderBy: [{ marketCap: { sort: "desc", nulls: "last" } }, { name: "asc" }],
      skip: (page - 1) * PER,
      take: PER,
    }),
    prisma.company.aggregate({ where, _sum: { marketCap: true } }),
  ]);

  const name = exchange.toUpperCase();
  const fullName = exchange === "nse" ? "National Stock Exchange" : "Bombay Stock Exchange";
  const totalPages = Math.max(1, Math.ceil(total / PER));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name, item: `${SITE}/exchange/${exchange}` },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `${fullName} (${name}) listed companies`,
        url: `${SITE}/exchange/${exchange}`,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: total,
          itemListElement: rows.slice(0, 50).map((c, i) => ({
            "@type": "ListItem",
            position: (page - 1) * PER + i + 1,
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
          <Breadcrumb items={[{ href: "/", label: "Home" }, { label: name }]} />
          <div className="mt-6 flex items-end gap-8 flex-wrap">
            <div className="min-w-0 flex-1">
              <p className="eyebrow">Exchange</p>
              <h1 className="font-display text-[clamp(40px,5vw,68px)] leading-[0.98] mt-2 text-ink">
                {fullName}
              </h1>
              <p className="text-mute mt-3">All active equity listings on the {name}.</p>
            </div>
            <dl className="grid grid-cols-2 gap-x-10 gap-y-2 shrink-0">
              <div>
                <dt className="eyebrow">Listings</dt>
                <dd className="font-mono tnum text-[26px] mt-1 leading-none">
                  {total.toLocaleString("en-IN")}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Aggregate cap</dt>
                <dd className="font-mono tnum text-[26px] mt-1 leading-none">
                  {crFromCr(capAgg._sum.marketCap ?? 0)}
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
              <span
                className="absolute left-0 top-0 bottom-0 w-[2px]"
                style={{ background: sectorColor(c.sector) }}
              />
              <span className="col-span-2 font-mono text-[12px] text-ink-2">{c.symbol}</span>
              <span className="col-span-6 font-display text-[17px] text-ink truncate">{c.name}</span>
              <span className="col-span-2 text-[12px] text-mute-2 truncate">{c.sector ?? "—"}</span>
              <span className="col-span-2 text-right font-mono text-[12px] tnum text-ink">
                {c.marketCap ? crFromCr(c.marketCap) : "—"}
              </span>
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <nav className="mt-8 flex items-center gap-1 font-mono text-[12px]">
            {page > 1 && (
              <Link className="px-3 py-2 border border-rule hover:border-ink" href={`/exchange/${exchange}?page=${page - 1}`}>
                ← Prev
              </Link>
            )}
            <span className="px-3 py-2">Page {page} / {totalPages}</span>
            {page < totalPages && (
              <Link className="px-3 py-2 border border-rule hover:border-ink" href={`/exchange/${exchange}?page=${page + 1}`}>
                Next →
              </Link>
            )}
          </nav>
        )}
      </section>

      <div className="max-w-[1280px] mx-auto px-6">
        <AdSlot position="bottom" />
      </div>
    </>
  );
}
