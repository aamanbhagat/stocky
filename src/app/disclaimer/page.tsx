import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";
import { BRAND } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: `${BRAND} provides information for educational purposes only and is not investment advice. Read the full disclaimer.`,
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <ContentPage eyebrow="Legal" title="Disclaimer">
      <h2>Not investment advice</h2>
      <p>
        {BRAND} is an informational and educational resource. Nothing on this website constitutes
        investment, financial, legal or tax advice, a recommendation, or an offer or solicitation to
        buy or sell any security. We are not a SEBI-registered investment adviser or research
        analyst, broker, or portfolio manager.
      </p>

      <h2>Accuracy of data</h2>
      <p>
        The data shown — including share prices, market capitalisation, valuation ratios, financials
        and shareholding patterns — is aggregated from third-party public sources such as NSE
        Archives, the BSE scrip master and Yahoo Finance. It is provided <strong>“as is”</strong>,
        may be delayed, incomplete or inaccurate, and is not guaranteed. Prices are not real-time and
        should not be relied upon for trading. Always verify figures against official exchange
        filings and company disclosures before acting.
      </p>

      <h2>No liability</h2>
      <p>
        You use this website at your own risk. {BRAND} and its operators accept no liability for any
        loss or damage arising directly or indirectly from the use of, or reliance on, any
        information presented here. Investing in securities carries risk, including the possible loss
        of principal.
      </p>

      <h2>External links and ads</h2>
      <p>
        This site displays third-party advertising (Google AdSense) and may link to external
        websites. We are not responsible for the content, products or privacy practices of any
        third-party site or advertiser.
      </p>

      <h2>Trademarks</h2>
      <p>
        Company names, logos, symbols and trademarks are the property of their respective owners and
        are used here for identification and reference purposes only. Their use does not imply any
        affiliation or endorsement.
      </p>

      <p>
        Questions? See <Link href="/contact">Contact</Link> or read our{" "}
        <Link href="/privacy">Privacy policy</Link>.
      </p>
    </ContentPage>
  );
}
