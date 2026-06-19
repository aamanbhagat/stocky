import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import styles from "./blog.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

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
    <main className={styles.wrap}>
      <header className={styles.head}>
        <h1 className={styles.h1}>Blog</h1>
        <p className={styles.lede}>Guides, explainers and how-tos.</p>
      </header>

      {posts.length === 0 ? (
        <p className={styles.empty}>No posts yet — check back soon.</p>
      ) : (
        <ul className={styles.grid}>
          {posts.map((p) => (
            <li key={p.slug} className={styles.card}>
              <Link href={`/blog/${p.slug}`} className={styles.cardLink}>
                {p.frontmatter.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.cover}
                    src={p.frontmatter.cover}
                    alt={p.frontmatter.coverAlt || p.frontmatter.title}
                    width={1200}
                    height={630}
                    loading="lazy"
                  />
                )}
                <div className={styles.cardBody}>
                  <span className={styles.cat}>{p.frontmatter.category}</span>
                  <h2 className={styles.cardTitle}>{p.frontmatter.title}</h2>
                  <p className={styles.cardDesc}>{p.frontmatter.description}</p>
                  <span className={styles.meta}>
                    {fmtDate(p.frontmatter.publishedAt)} ·{" "}
                    {p.readingTimeMinutes} min read
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
