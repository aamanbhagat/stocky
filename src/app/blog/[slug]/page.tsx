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
    <main className={styles.article}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <nav className={styles.crumbs}>
        <Link href="/blog">Blog</Link> <span aria-hidden>/</span>{" "}
        <span>{fm.category}</span>
      </nav>

      <header className={styles.articleHead}>
        <span className={styles.cat}>{fm.category}</span>
        <h1 className={styles.h1}>{fm.title}</h1>
        <p className={styles.meta}>
          {fmtDate(fm.publishedAt)} · {post.readingTimeMinutes} min read
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
          <h2>Related reading</h2>
          <ul>
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/blog/${r.slug}`}>{r.frontmatter.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
