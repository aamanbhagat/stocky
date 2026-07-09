import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sectorColor } from "@/lib/sectors";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";

export const revalidate = 86400;
export const dynamicParams = false;

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

export function generateStaticParams() {
  return LETTERS.map((letter) => ({ letter }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ letter: string }>;
}): Promise<Metadata> {
  const { letter } = await params;
  const lc = letter.toLowerCase();
  if (!LETTERS.includes(lc)) return { title: "Not found", robots: { index: false } };
  const L = lc.toUpperCase();
  return {
    title: `Companies Starting With ${L} — NSE & BSE Listed`,
    description: `All NSE and BSE listed companies whose name starts with ${L}. Share price, market cap, CIN, ISIN and shareholding for each.`,
    alternates: { canonical: `/browse/${lc}` },
  };
}

export default async function BrowseLetter({
  params,
}: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await params;
  const lc = letter.toLowerCase();
  if (!LETTERS.includes(lc)) notFound();
  const L = lc.toUpperCase();

  // SQLite LIKE is case-insensitive for ASCII, so "r%" also matches "Reliance…".
  const rows = await prisma.company.findMany({
    where: { name: { startsWith: lc } },
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true, symbol: true, exchange: true, sector: true },
  });

  return (
    <>
      <div className="border-b border-rule bg-paper-warm">
        <div className="max-w-[1080px] mx-auto px-6 pt-6 pb-10">
          <Breadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/browse", label: "Browse A–Z" },
              { label: L },
            ]}
          />
          <h1 className="font-display text-[clamp(36px,5vw,60px)] leading-[1.0] mt-6 text-ink">
            Companies starting with {L}
          </h1>
          <p className="text-mute text-[14px] mt-3">
            {rows.length.toLocaleString("en-IN")} listing{rows.length === 1 ? "" : "s"}.
          </p>

          <nav className="mt-6 flex flex-wrap gap-1.5 font-mono text-[12px]" aria-label="Alphabet">
            {LETTERS.map((x) => (
              <Link
                key={x}
                href={`/browse/${x}`}
                className={`px-2.5 py-1 border ${
                  x === lc ? "bg-ink text-paper border-ink" : "border-rule hover:border-ink"
                }`}
              >
                {x.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto px-6">
        <AdSlot position="top" />
      </div>

      <section className="max-w-[1080px] mx-auto px-6 pb-16">
        {rows.length === 0 ? (
          <p className="py-12 text-center text-mute">No companies start with {L}.</p>
        ) : (
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
                <span className="col-span-3 md:col-span-2 font-mono text-[12px] text-ink-2">
                  {c.symbol}
                </span>
                <span className="col-span-6 md:col-span-7 font-display text-[17px] text-ink truncate">
                  {c.name}
                </span>
                <span className="col-span-3 text-right md:text-left text-[12px] text-mute-2">
                  {c.exchange}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
