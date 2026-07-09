import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getAllPostSlugs, getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { getAuthor } from "@/lib/authors";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://financecity.me";
const SITE_NAME = "FinanceCity";

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
  const author = getAuthor(fm.author);

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: fm.title,
      description: fm.description,
      datePublished: fm.publishedAt,
      dateModified: fm.updatedAt || fm.publishedAt,
      image: fm.cover ? `${SITE_URL}${fm.cover}` : undefined,
      author: {
        "@type": "Person",
        name: author.name,
        url: `${SITE_URL}/authors/${author.slug}`,
        ...(author.sameAs?.length ? { sameAs: author.sameAs } : {}),
      },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: fm.title, item: url },
      ],
    },
  ];

  return (
    <div className="max-w-[760px] mx-auto px-6 pt-8 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <Breadcrumb
        items={[
          { href: "/", label: "Home" },
          { href: "/blog", label: "Blog" },
          { label: fm.category },
        ]}
      />

      <p className="eyebrow mt-6">{fm.category}</p>
      <h1 className="font-display text-3xl md:text-[2.75rem] leading-[1.08] font-bold text-ink tracking-tight mt-2">
        {fm.title}
      </h1>
      <p className="font-mono text-[12px] uppercase tracking-widest text-mute flex flex-wrap items-center gap-2 mt-5">
        <span>{fmtDate(fm.publishedAt)}</span>
        <span className="text-rule-strong">/</span>
        <span>{post.readingTimeMinutes} min read</span>
        <span className="text-rule-strong">/</span>
        <span>
          By{" "}
          <Link href={`/authors/${author.slug}`} className="text-saffron-dim hover:underline">
            {author.name}
          </Link>
        </span>
      </p>

      {fm.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fm.cover}
          alt={fm.coverAlt || fm.title}
          width={1200}
          height={630}
          fetchPriority="high"
          className="w-full aspect-[1200/630] object-cover border border-rule mt-7 mb-10"
        />
      )}

      <article className="prose-body">
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
        <section className="mt-16 border-t border-rule pt-7">
          <p className="eyebrow">Keep reading</p>
          <ul className="mt-3">
            {related.map((r) => (
              <li key={r.slug} className="border-b border-rule py-3">
                <Link
                  href={`/blog/${r.slug}`}
                  className="font-display text-lg font-semibold text-ink hover:text-saffron-dim"
                >
                  {r.frontmatter.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
