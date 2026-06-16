import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SECTORS } from "@/lib/sectors";
import { slugify } from "@/lib/slug";
import { SITE_URL as SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const companies = await prisma.company.findMany({
    select: { slug: true, updatedAt: true },
  });

  const now = new Date();

  const staticPages = ["/about", "/contact", "/privacy", "/disclaimer"].map((p) => ({
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
    ...staticPages,
    ...companies.map((c) => ({
      url: `${SITE}/companies/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
