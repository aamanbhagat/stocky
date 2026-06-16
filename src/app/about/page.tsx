import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";
import { BRAND } from "@/lib/site";

export const metadata: Metadata = {
  title: "About & data sources",
  description: `What ${BRAND} is, where its data comes from, and how often it updates. Sourced from NSE Archives, the BSE scrip master and Yahoo Finance.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="About"
      title={`About ${BRAND}`}
      intro={`${BRAND} is a free, open directory of every company listed on India's two main stock exchanges — the NSE and BSE.`}
    >
      <p>
        We bring together the basic facts about each listed company — share price, market
        capitalisation, valuation ratios, registration identifiers and shareholding pattern — into a
        single, fast, ad-supported reference. There is no login, no paywall and no popup.
      </p>

      <h2>Where the data comes from</h2>
      <p>Every figure on this site is sourced from public records:</p>
      <ul>
        <li>
          <strong>NSE Archives</strong> — the official equity list (symbol, company name, ISIN,
          series, listing date, face value) and the corporate shareholding master.
        </li>
        <li>
          <strong>BSE public scrip master</strong> — the active equity universe, BSE security codes
          and granular industry classification.
        </li>
        <li>
          <strong>Yahoo Finance</strong> — live share price, day change, market cap, P/E, P/B, EPS,
          book value, 52-week range, dividend yield, and (for larger companies) ROE, debt, revenue,
          margins, analyst targets and a business summary.
        </li>
      </ul>

      <h2>How often it updates</h2>
      <p>
        Prices, market cap and core ratios refresh automatically every week. Shareholding patterns
        are refreshed each quarter after companies file with the exchanges. The company universe is
        updated whenever the NSE or BSE add or remove listings.
      </p>

      <h2>How to use it</h2>
      <p>
        Search any company by name, symbol or ISIN from the{" "}
        <Link href="/">homepage</Link> or browse the full <Link href="/companies">directory</Link>,
        by <Link href="/exchange/nse">exchange</Link> or by sector. Each company has its own page
        with price, financials, ownership and registration details.
      </p>

      <h2>Important</h2>
      <p>
        {BRAND} is an information resource, not a broker or adviser. Nothing here is investment
        advice. Figures are best-effort and may lag the live market or contain errors — always
        verify against official exchange filings before making any decision. See our{" "}
        <Link href="/disclaimer">disclaimer</Link> for details.
      </p>
    </ContentPage>
  );
}
