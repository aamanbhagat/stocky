import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://financecity.me";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog — Investing & Market Explainers",
  description:
    "Plain-English guides to Indian markets: reading company fundamentals, sectors, IPOs and how the NSE and BSE work.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogIndex() {
  const posts = getAllPosts();
  return (
    <div className="max-w-[860px] mx-auto px-6 pt-10 pb-20">
      <p className="eyebrow">Blog</p>
      <h1 className="font-display text-4xl md:text-5xl font-bold text-ink tracking-tight mt-2">
        Markets, explained
      </h1>
      <p className="text-mute text-[15px] mt-3 max-w-xl">
        How to read companies, sectors and the indices — without the jargon.
      </p>

      {posts.length === 0 ? (
        <p className="text-mute mt-10">Nothing published yet. Check back soon.</p>
      ) : (
        <ul className="mt-10 border-t border-rule">
          {posts.map((p) => (
            <li key={p.slug} className="border-b border-rule">
              <Link
                href={`/blog/${p.slug}`}
                className="group grid sm:grid-cols-[200px_1fr] gap-5 py-7"
              >
                {p.frontmatter.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.frontmatter.cover}
                    alt={p.frontmatter.coverAlt || p.frontmatter.title}
                    width={1200}
                    height={630}
                    loading="lazy"
                    className="w-full aspect-[1200/630] object-cover border border-rule"
                  />
                )}
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-mute flex flex-wrap items-center gap-2">
                    <span className="text-saffron-dim">
                      {p.frontmatter.category}
                    </span>
                    <span className="text-rule-strong">/</span>
                    <span>{fmtDate(p.frontmatter.publishedAt)}</span>
                    <span className="text-rule-strong">/</span>
                    <span>{p.readingTimeMinutes} min</span>
                  </p>
                  <h2 className="font-display text-2xl font-bold text-ink tracking-tight mt-2 group-hover:text-saffron-dim">
                    {p.frontmatter.title}
                  </h2>
                  <p className="text-mute text-[15px] leading-relaxed mt-1">
                    {p.frontmatter.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
