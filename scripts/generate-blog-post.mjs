#!/usr/bin/env node
/**
 * generate-blog-post — write one SEO MDX article for this project's blog.
 *
 * Driven by ./blog.config.json in the repo root. Calls the Anthropic API to
 * draft a niche-matched article, validates the frontmatter, writes the MDX to
 * content/blog/<slug>.mdx and a branded SVG cover to public/blog/<slug>/cover.svg.
 *
 *   ANTHROPIC_API_KEY=... node scripts/generate-blog-post.mjs
 *
 * Env:
 *   ANTHROPIC_API_KEY  (required)
 *   BLOG_MODEL         (optional, default claude-sonnet-4-6)
 *   BLOG_COUNT         (optional, default 1 — how many posts this run)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "blog.config.json");
const BLOG_DIR = path.join(ROOT, "content", "blog");
const PUBLIC_BLOG_DIR = path.join(ROOT, "public", "blog");

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.BLOG_MODEL || "claude-sonnet-4-6";
const COUNT = Math.max(1, parseInt(process.env.BLOG_COUNT || "1", 10));

function die(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

if (!API_KEY) die("ANTHROPIC_API_KEY is not set.");
if (!fs.existsSync(CONFIG_PATH)) die("blog.config.json not found in repo root.");

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
const {
  siteName,
  siteUrl,
  niche,
  audience,
  categories = [],
  authors = [],
  topicGuidance = "",
} = config;

if (!siteName || !niche || categories.length === 0 || authors.length === 0) {
  die("blog.config.json must define siteName, niche, categories[], authors[].");
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function existingTitles() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, f), "utf8");
      const m = /title:\s*['"]?(.+?)['"]?\s*$/m.exec(raw);
      return m ? m[1] : f.replace(/\.mdx?$/, "");
    });
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Anthropic call ───────────────────────────────────────────
async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    die(`Anthropic API ${res.status}: ${body.slice(0, 500)}`);
  }
  const json = await res.json();
  return json.content.map((b) => b.text || "").join("");
}

function buildPrompt(avoid) {
  const today = new Date().toISOString().slice(0, 10);
  const cat = pick(categories);
  const author = pick(authors);
  return `You are a senior SEO content writer for ${siteName} (${siteUrl}), a site about ${niche}.
Target audience: ${audience || "general readers searching Google"}.
${topicGuidance}

Write ONE complete, original, genuinely useful long-form blog article (1200-1700 words) optimised to rank on Google.

Hard requirements:
- Pick a specific, high-intent, long-tail topic in category "${cat.slug}" (${cat.name}). Do NOT reuse any of these existing titles: ${JSON.stringify(avoid)}.
- Output MUST be a single MDX document and NOTHING else. No preamble, no code fences around the whole thing.
- Start with YAML frontmatter delimited by --- on its own lines, with EXACTLY these keys:
  title: a compelling <=70 char title containing the primary keyword
  description: a 50-160 char meta description containing the primary keyword
  category: ${cat.slug}
  tags: a YAML list of 4-6 short tags
  author: ${author.slug}
  publishedAt: '${today}'
  status: published
  featured: false
  sponsored: false
- After the frontmatter, write the body in clean MDX:
  - Open with a 2-3 sentence intro that states the primary keyword in the first sentence and the value proposition.
  - Use ## and ### headings (sentence case) structured for featured snippets.
  - Include a short bulleted or numbered list where natural.
  - Include one HTML <figure> with a caption near the top using src="/blog/SLUG/figure.svg" (use the literal token SLUG — it will be replaced).
  - End with a "## Frequently asked questions" section containing 3 Q&As as ### questions.
  - Be specific and factual; avoid fluff and hallucinated statistics. Use India context where the niche implies it.
- Do not include the word "SLUG" anywhere except inside the figure src.

Return only the MDX document.`;
}

function extractFrontmatter(mdx) {
  const m = /^---\n([\s\S]*?)\n---/.exec(mdx);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (kv) fm[kv[1]] = kv[2].replace(/^['"]|['"]$/g, "");
  }
  return fm;
}

// ── Cover SVG (branded, deterministic) ───────────────────────
function coverSvg(title, category) {
  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // wrap title into <=3 lines
  const words = title.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > 24 && cur) {
      lines.push(cur.trim());
      cur = w;
    } else cur = (cur + " " + w).trim();
    if (lines.length === 2) break;
  }
  if (cur && lines.length < 3) lines.push(cur.trim());
  const a = config.coverColors?.[0] || "#0f172a";
  const b = config.coverColors?.[1] || "#1e3a8a";
  const tspans = lines
    .map(
      (l, i) =>
        `<tspan x="80" dy="${i === 0 ? 0 : 76}">${esc(l)}</tspan>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
  </linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="80" y="120" font-family="system-ui,Segoe UI,Arial" font-size="26" fill="#93c5fd" letter-spacing="3">${esc(
    (category || "").toUpperCase(),
  )}</text>
  <text x="80" y="300" font-family="system-ui,Segoe UI,Arial" font-size="64" font-weight="700" fill="#ffffff">${tspans}</text>
  <text x="80" y="560" font-family="system-ui,Segoe UI,Arial" font-size="30" font-weight="600" fill="#e2e8f0">${esc(
    siteName,
  )}</text>
</svg>`;
}

async function generateOne() {
  const avoid = existingTitles();
  let mdx = (await callClaude(buildPrompt(avoid))).trim();
  // strip accidental code fences
  mdx = mdx.replace(/^```(mdx|markdown)?\n/, "").replace(/\n```$/, "").trim();

  const fm = extractFrontmatter(mdx);
  if (!fm || !fm.title) die("Generated output missing valid frontmatter/title.");
  const slug = slugify(fm.title);
  if (!slug) die("Could not derive slug from title.");

  // Replace SLUG token in figure paths with the real slug.
  mdx = mdx.replace(/\/blog\/SLUG\//g, `/blog/${slug}/`);

  // Inject a cover reference if absent.
  if (!/^cover:/m.test(mdx)) {
    mdx = mdx.replace(
      /^status:/m,
      `cover: /blog/${slug}/cover.svg\ncoverAlt: '${fm.title.replace(/'/g, "")}'\nstatus:`,
    );
  }

  fs.mkdirSync(BLOG_DIR, { recursive: true });
  const outPath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (fs.existsSync(outPath)) {
    console.log(`• Skipping duplicate slug: ${slug}`);
    return null;
  }
  fs.writeFileSync(outPath, mdx + "\n");

  // Covers (cover + figure use the same generated SVG).
  const assetDir = path.join(PUBLIC_BLOG_DIR, slug);
  fs.mkdirSync(assetDir, { recursive: true });
  const svg = coverSvg(fm.title, fm.category);
  fs.writeFileSync(path.join(assetDir, "cover.svg"), svg);
  fs.writeFileSync(path.join(assetDir, "figure.svg"), svg);

  console.log(`✓ ${slug}`);
  return slug;
}

const written = [];
for (let i = 0; i < COUNT; i++) {
  const s = await generateOne();
  if (s) written.push(s);
}
if (written.length === 0) die("No posts written.");
console.log(`\nDone — ${written.length} post(s): ${written.join(", ")}`);
