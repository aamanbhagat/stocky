import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import {
  getAllPostSlugs,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/blog";
import styles from "../blog.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "";
const ACCENT = process.env.NEXT_PUBLIC_BLOG_ACCENT || "#16a34a";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not found", robots: { index: false } };
  const { title, description, cover, coverAlt, publishedAt, updatedAt } =
    post.frontmatter;
  const url = `${SITE_URL}/blog/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: publishedAt,
      modifiedTime: updatedAt || publishedAt,
      images: cover ? [{ url: cover, alt: coverAlt || title }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BlogPost({ params }: Params) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { frontmatter: fm } = post;
  const url = `${SITE_URL}/blog/${slug}`;
  const related = getRelatedPosts(post, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: fm.title,
    description: fm.description,
    datePublished: fm.publishedAt,
    dateModified: fm.updatedAt || fm.publishedAt,
    image: fm.cover ? `${SITE_URL}${fm.cover}` : undefined,
    author: { "@type": "Person", name: fm.author },
    publisher: { "@type": "Organization", name: SITE_NAME || fm.author },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <div className={styles.scope} style={{ ["--accent" as string]: ACCENT }}>
      <span className={styles.progress} aria-hidden />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <main className={styles.article}>
        <nav className={styles.crumbs}>
          <Link href="/blog">Blog</Link>{" "}
          <span aria-hidden>/</span> <span>{fm.category}</span>
        </nav>

        <header className={styles.articleHead}>
          <p className={styles.eyebrow}>{fm.category}</p>
          <h1 className={styles.title}>{fm.title}</h1>
          <p className={styles.dateline}>
            <span>{fm.author}</span>
            <span className={styles.dot}>·</span>
            <span>{fmtDate(fm.publishedAt)}</span>
            <span className={styles.dot}>·</span>
            <span>{post.readingTimeMinutes} min read</span>
          </p>
        </header>

        {fm.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.hero}
            src={fm.cover}
            alt={fm.coverAlt || fm.title}
            width={1200}
            height={630}
            fetchPriority="high"
          />
        )}

        <article className={styles.prose}>
          <MDXRemote
            source={post.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [
                  rehypeSlug,
                  [rehypeAutolinkHeadings, { behavior: "wrap" }],
                ],
              },
            }}
          />
        </article>

        {related.length > 0 && (
          <section className={styles.related}>
            <h2 className={styles.relatedTitle}>Keep reading</h2>
            <ul className={styles.relatedList}>
              {related.map((r, i) => (
                <li key={r.slug} className={styles.relatedItem}>
                  <span className={styles.relatedIndex}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Link href={`/blog/${r.slug}`} className={styles.relatedLink}>
                    {r.frontmatter.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
