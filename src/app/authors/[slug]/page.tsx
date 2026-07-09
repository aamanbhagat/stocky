import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentPage } from "@/components/ContentPage";
import { getAllAuthors } from "@/lib/authors";
import { getAllPosts } from "@/lib/blog";
import { SITE_URL as SITE, BRAND } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllAuthors().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = getAllAuthors().find((a) => a.slug === slug);
  if (!author) return { title: "Author not found", robots: { index: false } };
  return {
    title: `${author.name} — ${author.role}`,
    description: author.bio.slice(0, 155),
    alternates: { canonical: `/authors/${author.slug}` },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = getAllAuthors().find((a) => a.slug === slug);
  if (!author) notFound();

  const posts = getAllPosts().filter(
    (p) => (p.frontmatter.author || "financecity-desk") === author.slug,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: author.name,
      url: `${SITE}/authors/${author.slug}`,
      jobTitle: author.role,
      description: author.bio,
      worksFor: { "@type": "Organization", name: BRAND, url: SITE },
      ...(author.sameAs?.length ? { sameAs: author.sameAs } : {}),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContentPage eyebrow={author.role} title={author.name} intro={author.credentials}>
        <p>{author.bio}</p>

        {author.sameAs?.length ? (
          <p>
            Elsewhere:{" "}
            {author.sameAs.map((u, i) => (
              <span key={u}>
                {i > 0 ? " · " : ""}
                <a href={u} target="_blank" rel="noopener noreferrer me">
                  {u.replace(/^https?:\/\//, "")}
                </a>
              </span>
            ))}
          </p>
        ) : null}

        {posts.length > 0 && (
          <>
            <h2>Articles by {author.name}</h2>
            <ul>
              {posts.map((p) => (
                <li key={p.slug}>
                  <Link href={`/blog/${p.slug}`}>{p.frontmatter.title}</Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </ContentPage>
    </>
  );
}
