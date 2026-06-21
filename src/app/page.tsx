import { prisma } from "@/lib/prisma";
import { Tape } from "@/components/Tape";
import { LiveSearch } from "@/components/LiveSearch";
import { SectorGrid } from "@/components/SectorGrid";
import { CompanyCard } from "@/components/CompanyCard";
import { LiveQuoteProvider } from "@/components/LiveQuoteProvider";
import { seedQuotes } from "@/lib/liveSeed";
import { crFromCr, num } from "@/lib/format";
import Link from "next/link";

export const revalidate = 3600;

export default async function HomePage() {
  const [total, nseCount, bseCount, totalCapAgg, topByCap, tapeRows] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { exchange: { in: ["NSE", "BOTH"] } } }),
    prisma.company.count({ where: { exchange: { in: ["BSE", "BOTH"] } } }),
    prisma.company.aggregate({ _sum: { marketCap: true } }),
    prisma.company.findMany({
      where: { marketCap: { not: null } },
      orderBy: { marketCap: "desc" },
      take: 8,
    }),
    prisma.company.findMany({
      where: { marketCap: { not: null } },
      orderBy: { marketCap: "desc" },
      take: 30,
      select: { symbol: true, slug: true, name: true, marketCap: true, yahooSymbol: true },
    }),
  ]);

  const totalCapCr = totalCapAgg._sum.marketCap ?? 0;
  const liveSeed = seedQuotes([...tapeRows, ...topByCap]);
  const stamp = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <LiveQuoteProvider seed={liveSeed}>
      <Tape rows={tapeRows} />

      <section className="border-b border-rule">
        <div className="max-w-[1280px] mx-auto px-6 pt-14 pb-16 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <p className="eyebrow">Edition · {stamp}</p>
            <h1 className="font-display text-[clamp(44px,7vw,88px)] leading-[0.95] mt-3 text-ink">
              <span className="tnum">{num(total, 0)}</span> listed companies.
              <br />
              <span className="italic text-saffron-dim">One open database.</span>
            </h1>
            <p className="mt-6 text-[17px] text-mute max-w-2xl leading-relaxed">
              Every active equity on NSE and BSE — share price, CIN, ISIN, promoter holding,
              sector. Updated weekly from the official exchange archives.
            </p>
            <div className="mt-8 max-w-[640px]">
              <LiveSearch />
            </div>
          </div>

          <aside className="lg:col-span-4 lg:border-l lg:border-rule lg:pl-8 flex flex-col gap-6">
            <Stat label="Total listings" value={num(total, 0)} />
            <Stat label="NSE" value={num(nseCount, 0)} />
            <Stat label="BSE" value={num(bseCount, 0)} />
            <Stat
              label="Aggregate market cap"
              value={crFromCr(totalCapCr)}
              note="across all listed equities"
            />
          </aside>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-6 py-16">
        <header className="flex items-end justify-between gap-6 mb-8 flex-wrap">
          <div>
            <p className="eyebrow">01 · By sector</p>
            <h2 className="font-display text-[42px] leading-tight mt-1">
              Where the listings live
            </h2>
          </div>
          <p className="text-[14px] text-mute max-w-md">
            Each sector aggregates every company in that vertical across both exchanges.
          </p>
        </header>
        <SectorGrid />
      </section>

      <section className="max-w-[1280px] mx-auto px-6 py-16 border-t border-rule">
        <header className="flex items-end justify-between gap-6 mb-8 flex-wrap">
          <div>
            <p className="eyebrow">02 · By market cap</p>
            <h2 className="font-display text-[42px] leading-tight mt-1">
              India&rsquo;s eight largest, today
            </h2>
          </div>
          <Link href="/companies?sort=cap" className="font-mono text-[12px] tracking-widest uppercase border-b border-ink hover:border-saffron hover:text-saffron-dim">
            Full ranking →
          </Link>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {topByCap.map((c) => (
            <CompanyCard key={c.id} c={c} />
          ))}
        </div>
      </section>
    </LiveQuoteProvider>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="font-mono text-[28px] tnum mt-1 text-ink leading-none">{value}</p>
      {note && <p className="text-[12px] text-mute-2 mt-1">{note}</p>}
    </div>
  );
}
