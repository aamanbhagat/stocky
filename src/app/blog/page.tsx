import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import styles from "./blog.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";
const ACCENT = process.env.NEXT_PUBLIC_BLOG_ACCENT || "#16a34a";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides, explainers and how-tos.",
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
    <div className={styles.scope} style={{ ["--accent" as string]: ACCENT }}>
      <main className={styles.wrap}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>The Journal</p>
          <h1 className={styles.h1}>Blog</h1>
          <p className={styles.lede}>
            Clear, practical guides and explainers — written to be read, not
            skimmed.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className={styles.empty}>Nothing published yet. Check back soon.</p>
        ) : (
          <ul className={styles.feed}>
            {posts.map((p) => (
              <li key={p.slug} className={styles.row}>
                <Link href={`/blog/${p.slug}`} className={styles.rowLink}>
                  {p.frontmatter.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className={styles.thumb}
                      src={p.frontmatter.cover}
                      alt={p.frontmatter.coverAlt || p.frontmatter.title}
                      width={1200}
                      height={630}
                      loading="lazy"
                    />
                  )}
                  <div>
                    <p className={styles.rowMeta}>
                      <span className={styles.rowCat}>
                        {p.frontmatter.category}
                      </span>
                      <span className={styles.dot}>·</span>
                      <span>{fmtDate(p.frontmatter.publishedAt)}</span>
                      <span className={styles.dot}>·</span>
                      <span>{p.readingTimeMinutes} min</span>
                    </p>
                    <h2 className={styles.rowTitle}>{p.frontmatter.title}</h2>
                    <p className={styles.rowDesc}>{p.frontmatter.description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
