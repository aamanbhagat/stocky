import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (q.length < 1) return NextResponse.json({ results: [] });

  const qu = q.toUpperCase();

  // Exact-symbol and prefix matches rank above contains matches.
  const where: Prisma.CompanyWhereInput = {
    OR: [
      { symbol: { contains: qu } },
      { name: { contains: q } },
      { isin: { contains: qu } },
    ],
  };

  const rows = await prisma.company.findMany({
    where,
    select: {
      slug: true,
      symbol: true,
      name: true,
      sector: true,
      exchange: true,
      marketCap: true,
      currentPrice: true,
      dayChangePct: true,
    },
    take: 40,
  });

  // Relevance sort in app layer: exact symbol > symbol prefix > name prefix > cap
  const scored = rows
    .map((r) => {
      const sym = r.symbol.toUpperCase();
      const name = r.name.toUpperCase();
      let score = 0;
      if (sym === qu) score += 1000;
      else if (sym.startsWith(qu)) score += 500;
      else if (sym.includes(qu)) score += 200;
      if (name.startsWith(qu)) score += 120;
      else if (name.includes(qu)) score += 60;
      score += Math.min((r.marketCap ?? 0) / 1e5, 50); // cap nudge, bounded
      return { r, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ r }) => r);

  return NextResponse.json(
    { results: scored },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
