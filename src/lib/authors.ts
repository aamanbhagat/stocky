/**
 * Author registry — powers blog bylines, the /authors/[slug] pages and author
 * structured data (schema.org Person). Keyed by the `author` slug used in each
 * post's frontmatter.
 *
 * E-E-A-T note: for a YMYL/finance site, supplementing this editorial-desk
 * byline with a *real named* author — verifiable credentials plus an off-site
 * profile (e.g. LinkedIn) in `sameAs` — materially strengthens trust signals.
 * Add such entries here and reference their slug in the post frontmatter.
 */
export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string;
  credentials?: string;
  /** Off-site profiles surfaced as schema.org Person.sameAs (LinkedIn, X, etc.). */
  sameAs?: string[];
}

const AUTHORS: Record<string, Author> = {
  "financecity-desk": {
    slug: "financecity-desk",
    name: "FinanceCity Desk",
    role: "Editorial team",
    bio:
      "The FinanceCity Desk is the in-house editorial team behind FinanceCity's guides to the Indian markets. It writes plain-English explainers on company fundamentals, financial ratios, sectors, indices and IPOs — and checks every article against primary sources: NSE and BSE filings, company disclosures and the official exchange archives that power the 5,000+ company profiles on this site.",
    credentials:
      "Covers NSE & BSE listed companies, financial statements, valuation ratios and market structure. Data is refreshed from exchange archives and Yahoo Finance.",
  },
};

export const DEFAULT_AUTHOR = "financecity-desk";

export function getAuthor(slug?: string | null): Author {
  return (slug && AUTHORS[slug]) || AUTHORS[DEFAULT_AUTHOR];
}

export function getAllAuthors(): Author[] {
  return Object.values(AUTHORS);
}
