import { prisma } from "./prisma";

/** Separator for /compare/<a>-vs-<b> pair slugs. */
export const PAIR_SEP = "-vs-";

/** Canonical pair = the two company slugs sorted alphabetically, so a-vs-b and
 *  b-vs-a collapse to one indexable URL. */
export function canonicalPair(a: string, b: string): string {
  return [a, b].sort().join(PAIR_SEP);
}

export function parsePair(pair: string): [string, string] | null {
  const i = pair.indexOf(PAIR_SEP);
  if (i === -1) return null;
  const a = pair.slice(0, i);
  const b = pair.slice(i + PAIR_SEP.length);
  if (!a || !b || a === b) return null;
  return [a, b];
}

/** Same-sector, top-cap adjacent pairs — the comparisons people actually search.
 *  Shared by the compare route's generateStaticParams and the sitemap. */
export async function seededComparePairs(): Promise<string[]> {
  const rows = await prisma.company.findMany({
    where: { marketCap: { not: null }, sector: { not: null } },
    orderBy: [{ sector: "asc" }, { marketCap: "desc" }],
    select: { slug: true, sector: true },
  });
  const groups = new Map<string, string[]>();
  for (const c of rows) {
    const arr = groups.get(c.sector!) ?? [];
    if (arr.length < 5) arr.push(c.slug);
    groups.set(c.sector!, arr);
  }
  const pairs: string[] = [];
  for (const slugs of groups.values()) {
    for (let i = 0; i < slugs.length - 1; i++) {
      pairs.push(canonicalPair(slugs[i], slugs[i + 1]));
    }
  }
  return pairs;
}
