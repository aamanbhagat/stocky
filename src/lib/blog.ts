import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import GithubSlugger from "github-slugger";

// Self-contained MDX blog loader. Drop-in: reads content/blog/*.mdx, validates
// the minimal frontmatter contract, exposes list/detail/related helpers.

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface PostFrontmatter {
  title: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt?: string;
  cover?: string;
  coverAlt?: string;
  status?: "draft" | "published" | "scheduled";
  featured?: boolean;
  sponsored?: boolean;
}

export interface TocItem {
  depth: 2 | 3;
  text: string;
  slug: string;
}

export interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  readingTimeMinutes: number;
  wordCount: number;
  toc: TocItem[];
}

function readMdxFiles(): { slug: string; raw: string }[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((file) => ({
      slug: file.replace(/\.mdx?$/, ""),
      raw: fs.readFileSync(path.join(BLOG_DIR, file), "utf8"),
    }));
}

function extractToc(content: string): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of content.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const text = match[2].replace(/[*_`]/g, "").trim();
    items.push({ depth: match[1].length as 2 | 3, text, slug: slugger.slug(text) });
  }
  return items;
}

let cache: Post[] | null = null;

function loadAll(): Post[] {
  if (cache) return cache;
  cache = readMdxFiles().map(({ slug, raw }) => {
    const { data, content } = matter(raw);
    const fm = data as Partial<PostFrontmatter>;
    if (!fm.title || !fm.description) {
      throw new Error(`Invalid frontmatter in content/blog/${slug}.mdx`);
    }
    const stats = readingTime(content);
    return {
      slug,
      frontmatter: {
        tags: [],
        status: "published",
        featured: false,
        sponsored: false,
        ...fm,
      } as PostFrontmatter,
      content,
      readingTimeMinutes: Math.max(1, Math.round(stats.minutes)),
      wordCount: stats.words,
      toc: extractToc(content),
    } satisfies Post;
  });
  return cache;
}

function isLive(p: Post): boolean {
  return (
    p.frontmatter.status === "published" &&
    new Date(p.frontmatter.publishedAt).getTime() <= Date.now()
  );
}

function byDateDesc(a: Post, b: Post): number {
  return (
    new Date(b.frontmatter.publishedAt).getTime() -
    new Date(a.frontmatter.publishedAt).getTime()
  );
}

export function getAllPosts(): Post[] {
  return loadAll().filter(isLive).sort(byDateDesc);
}

export function getPostBySlug(slug: string): Post | undefined {
  return loadAll().find((p) => p.slug === slug && isLive(p));
}

export function getAllPostSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

export function getRelatedPosts(post: Post, limit = 3): Post[] {
  return getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      let score = p.frontmatter.category === post.frontmatter.category ? 2 : 0;
      score += p.frontmatter.tags.filter((t) =>
        post.frontmatter.tags.includes(t),
      ).length;
      return { post: p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || byDateDesc(a.post, b.post))
    .slice(0, limit)
    .map((x) => x.post);
}
