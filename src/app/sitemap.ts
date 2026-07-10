import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SECTORS } from "@/lib/sectors";
import { slugify } from "@/lib/slug";
import { SITE_URL as SITE } from "@/lib/site";
import { getAllPosts } from "@/lib/blog";
import { SCREENS } from "@/lib/screens";
import { getAllAuthors } from "@/lib/authors";
import { seededComparePairs } from "@/lib/compare";
import { isThinCompany } from "@/lib/copy";

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const companies = await prisma.company.findMany({
    select: {
      slug: true,
      updatedAt: true,
      name: true,
      currentPrice: true,
      marketCap: true,
      revenue: true,
      netProfit: true,
      roe: true,
      eps: true,
      promoterHolding: true,
      institutionalHolding: true,
    },
  });
  const comparePairs = await seededComparePairs();

  const now = new Date();

  const blogPages = [
    {
      url: `${SITE}/blog`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    ...getAllPosts().map((p) => ({
      url: `${SITE}/blog/${p.slug}`,
      lastModified: new Date(p.frontmatter.updatedAt || p.frontmatter.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  // Curated list/screener pages — mid-tail, list-intent surfaces.
  const stockListPages = [
    {
      url: `${SITE}/stocks`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    },
    ...SCREENS.map((s) => ({
      url: `${SITE}/stocks/${s.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];

  // A–Z crawl index (kills orphan company pages).
  const browsePages = [
    {
      url: `${SITE}/browse`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    ...LETTERS.map((l) => ({
      url: `${SITE}/browse/${l}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ];

  // Seeded, sector-adjacent comparison pages.
  const comparePages = comparePairs.map((pair) => ({
    url: `${SITE}/compare/${pair}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const authorPages = getAllAuthors().map((a) => ({
    url: `${SITE}/authors/${a.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.3,
  }));

  const staticPages = ["/about", "/methodology", "/contact", "/privacy", "/disclaimer"].map((p) => ({
    url: `${SITE}${p}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.3,
  }));

  return [
    {
      url: `${SITE}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE}/companies`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE}/exchange/nse`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE}/exchange/bse`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...SECTORS.map((s) => ({
      url: `${SITE}/sector/${slugify(s)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...stockListPages,
    ...browsePages,
    ...comparePages,
    ...staticPages,
    ...authorPages,
    ...blogPages,
    ...companies
      .filter((c) => !isThinCompany(c))
      .map((c) => ({
        url: `${SITE}/companies/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  ];
}
