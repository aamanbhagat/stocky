import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";
import { BRAND } from "@/lib/site";

export const metadata: Metadata = {
  title: "Data methodology & sources",
  description: `Exactly how ${BRAND} sources, merges and refreshes its data on 5,000+ NSE & BSE listed companies — the primary sources, the update cadence for each field, and known limitations.`,
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <ContentPage
      eyebrow="Methodology"
      title="How our data is sourced"
      intro={`${BRAND} is built on public exchange records. This page documents where every figure comes from, how often it refreshes, and what its limitations are — so you can judge it and check it yourself.`}
    >
      <h2>Primary sources</h2>
      <ul>
        <li>
          <strong>NSE Archives</strong> — the official equity list (symbol, company name, ISIN,
          series, listing date, face value) and the corporate shareholding master used for
          promoter and public holding.
        </li>
        <li>
          <strong>BSE public scrip master</strong> — the active equity universe, BSE security
          codes and granular industry classification.
        </li>
        <li>
          <strong>NSE index constituent files</strong> (Nifty Total Market / 500 / Midcap150 /
          Smallcap250 / Microcap250) — used as the authoritative sector classification.
        </li>
        <li>
          <strong>Yahoo Finance</strong> — live price, day change, market cap, P/E, P/B, EPS, book
          value, 52-week range and dividend yield for all companies; and, for larger companies,
          ROE, ROA, debt, revenue, EBITDA, margins, growth, beta, analyst targets, employee count
          and a business summary.
        </li>
      </ul>

      <h2>How records are merged</h2>
      <p>
        Companies are keyed on <strong>ISIN</strong>, the globally unique security identifier. A
        name dual-listed on both exchanges collapses into a single record marked as listed on both
        NSE and BSE, so you never see two half-populated pages for the same company.
      </p>

      <h2>Update cadence (by field)</h2>
      <ul>
        <li>
          <strong>Price, day change, market cap, P/E, P/B, EPS, 52-week range, dividend yield</strong>{" "}
          — refreshed automatically on a scheduled job from Yahoo Finance.
        </li>
        <li>
          <strong>Deep financials</strong> (ROE, debt, revenue, margins, analyst view) — refreshed
          periodically for the larger-cap universe.
        </li>
        <li>
          <strong>Shareholding pattern</strong> (promoter / institutional / public) — refreshed
          each quarter, after companies file with the exchanges. Every pattern shows its
          &ldquo;as of&rdquo; quarter on the company page.
        </li>
        <li>
          <strong>Company universe</strong> (new listings, delistings) — updated as the NSE and BSE
          change their master lists.
        </li>
      </ul>

      <h2>Limitations &amp; corrections</h2>
      <p>
        Figures are best-effort and can lag the live market, be delayed by a source, or contain
        errors. Company filings on the NSE, BSE and MCA portals remain the authoritative record for
        financial, governance and disclosure data. If you spot a discrepancy, please{" "}
        <Link href="/contact">tell us</Link> and we will correct it.
      </p>

      <h2>Not investment advice</h2>
      <p>
        {BRAND} is an information resource, not a broker or adviser. Nothing here is a
        recommendation to buy or sell any security. Always verify against official filings and, where
        appropriate, consult a registered adviser. See our <Link href="/disclaimer">disclaimer</Link>.
      </p>
    </ContentPage>
  );
}
