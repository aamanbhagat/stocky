import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { SECTORS, sectorColor } from "@/lib/sectors";
import { slugify } from "@/lib/slug";
import { LiveSearch } from "@/components/LiveSearch";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { LiveQuoteProvider } from "@/components/LiveQuoteProvider";
import { LiveCap } from "@/components/LiveCap";
import { seedQuotes } from "@/lib/liveSeed";

export const revalidate = 3600;

const PER_PAGE = 50;

type SP = {
  q?: string;
  sector?: string;
  exchange?: string;
  sort?: "cap" | "az";
  page?: string;
};

// Faceted/paginated directory states dilute crawl budget and duplicate the
// clean sector/exchange pages (which are separately indexable and in the
// sitemap). Keep the bare /companies indexable with a self-canonical; for any
// filtered or deep-paginated view emit noindex,follow. We deliberately do NOT
// also set rel=canonical there — Google treats noindex + canonical as
// conflicting signals — and rely on noindex,follow to drop the URL while still
// letting crawl equity flow through to the linked company pages.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const q = (sp.q ?? "").trim();
  const sector = (sp.sector ?? "").trim();
  const exchange = (sp.exchange ?? "").trim().toLowerCase();
  const isFiltered = Boolean(q || sector || exchange) || page > 1;

  const base = {
    title: "All NSE & BSE Listed Companies — Browse Directory",
    description:
      "Browse the complete directory of every company listed on NSE and BSE. Filter by sector, exchange, market cap. Free, structured, weekly-updated.",
  };

  return isFiltered
    ? { ...base, robots: { index: false, follow: true } }
    : { ...base, alternates: { canonical: "/companies" } };
}

export default async function Directory({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const q = (sp.q ?? "").trim();
  const sector = (sp.sector ?? "").trim();
  const exchange = (sp.exchange ?? "").trim().toUpperCase();
  const sort = sp.sort === "cap" ? "cap" : "az";

  const where: Prisma.CompanyWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { symbol: { contains: q.toUpperCase() } },
      { isin: { contains: q.toUpperCase() } },
    ];
  }
  if (sector) {
    const matched = SECTORS.find((s) => slugify(s) === sector);
    if (matched) where.sector = matched;
  }
  if (exchange === "NSE") where.exchange = { in: ["NSE", "BOTH"] };
  if (exchange === "BSE") where.exchange = { in: ["BSE", "BOTH"] };

  const orderBy: Prisma.CompanyOrderByWithRelationInput =
    sort === "cap" ? { marketCap: "desc" } : { name: "asc" };

  const [total, rows] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const baseHref = (overrides: Partial<SP> = {}) => {
    const next = new URLSearchParams();
    const merged = { ...sp, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v != null && v !== "") next.set(k, String(v));
    }
    const qs = next.toString();
    return qs ? `/companies?${qs}` : "/companies";
  };

  return (
    <>
      <div className="border-b border-rule bg-paper-warm">
        <div className="max-w-[1280px] mx-auto px-6 pt-6 pb-10">
          <Breadcrumb items={[{ href: "/", label: "Home" }, { label: "All companies" }]} />
          <h1 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.98] mt-6 text-ink">
            The directory
          </h1>
          <p className="text-mute text-[15px] mt-3 max-w-2xl">
            {total.toLocaleString("en-IN")} active equity listings across NSE and BSE.
            Refine by sector, exchange or symbol.
          </p>
          <div className="mt-6 max-w-2xl">
            <LiveSearch size="sm" />
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 py-10 grid lg:grid-cols-12 gap-10">
        {/* SIDEBAR */}
        <aside className="lg:col-span-3 space-y-8">
          <FilterGroup title="Exchange">
            <FilterLink active={!exchange} href={baseHref({ exchange: "", page: "1" })}>All exchanges</FilterLink>
            <FilterLink active={exchange === "NSE"} href={baseHref({ exchange: "nse", page: "1" })}>NSE</FilterLink>
            <FilterLink active={exchange === "BSE"} href={baseHref({ exchange: "bse", page: "1" })}>BSE</FilterLink>
          </FilterGroup>

          <FilterGroup title="Sector">
            <FilterLink active={!sector} href={baseHref({ sector: "", page: "1" })}>All sectors</FilterLink>
            {SECTORS.map((s) => (
              <FilterLink
                key={s}
                active={sector === slugify(s)}
                href={baseHref({ sector: slugify(s), page: "1" })}
                accent={sectorColor(s)}
              >
                {s}
              </FilterLink>
            ))}
          </FilterGroup>

          <FilterGroup title="Sort by">
            <FilterLink active={sort === "az"} href={baseHref({ sort: "az", page: "1" })}>A → Z</FilterLink>
            <FilterLink active={sort === "cap"} href={baseHref({ sort: "cap", page: "1" })}>Market cap</FilterLink>
          </FilterGroup>
        </aside>

        {/* TABLE */}
        <section className="lg:col-span-9">
          <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
            <p className="eyebrow">
              {total.toLocaleString("en-IN")} results · page {page} of {totalPages}
            </p>
            <p className="font-mono text-[11px] text-mute-2">Sorted: {sort === "cap" ? "market cap desc" : "alphabetical"}</p>
          </div>

          <LiveQuoteProvider seed={seedQuotes(rows)}>
          <div className="border-t border-b border-ink divide-y divide-rule">
            {rows.length === 0 && (
              <p className="py-12 text-center text-mute">No companies match these filters.</p>
            )}
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
                <span className="col-span-5 md:col-span-6 font-display text-[17px] text-ink truncate">{c.name}</span>
                <span className="col-span-3 md:col-span-2 text-[12px] text-mute-2 truncate">{c.sector ?? "—"}</span>
                <span className="col-span-2 text-right font-mono text-[12px] tnum text-ink">
                  <LiveCap symbol={c.yahooSymbol} seed={c.marketCap} />
                </span>
              </Link>
            ))}
          </div>
          </LiveQuoteProvider>

          <Pagination page={page} totalPages={totalPages} hrefFor={(p) => baseHref({ page: String(p) })} />

          <AdSlot position="bottom" />
        </section>
      </div>
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-3">{title}</p>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function FilterLink({
  children,
  href,
  active,
  accent,
}: {
  children: React.ReactNode;
  href: string;
  active: boolean;
  accent?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center gap-2 text-[13px] py-1 ${
          active ? "text-ink font-medium" : "text-mute hover:text-ink"
        }`}
      >
        {accent && (
          <span className="block w-[3px] h-3 shrink-0" style={{ background: accent }} />
        )}
        <span className="truncate">{children}</span>
      </Link>
    </li>
  );
}

function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (p: number) => string;
}) {
  if (totalPages <= 1) return null;
  const window: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) window.push(p);

  return (
    <nav className="mt-8 flex items-center gap-1 font-mono text-[12px]" aria-label="Pagination">
      {page > 1 && (
        <Link className="px-3 py-2 border border-rule hover:border-ink" href={hrefFor(page - 1)}>
          ← Prev
        </Link>
      )}
      {window[0] > 1 && (
        <>
          <Link className="px-3 py-2 border border-rule hover:border-ink" href={hrefFor(1)}>1</Link>
          {window[0] > 2 && <span className="px-2 text-mute-2">…</span>}
        </>
      )}
      {window.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          className={`px-3 py-2 border ${p === page ? "bg-ink text-paper border-ink" : "border-rule hover:border-ink"}`}
        >
          {p}
        </Link>
      ))}
      {window[window.length - 1] < totalPages && (
        <>
          {window[window.length - 1] < totalPages - 1 && <span className="px-2 text-mute-2">…</span>}
          <Link className="px-3 py-2 border border-rule hover:border-ink" href={hrefFor(totalPages)}>
            {totalPages}
          </Link>
        </>
      )}
      {page < totalPages && (
        <Link className="px-3 py-2 border border-rule hover:border-ink" href={hrefFor(page + 1)}>
          Next →
        </Link>
      )}
    </nav>
  );
}
