import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";
import { BRAND, ORG_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${BRAND} to report a data error, request a correction, or ask a question.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <ContentPage
      eyebrow="Contact"
      title="Get in touch"
      intro="Spotted a wrong figure, an outdated listing, or have a question? We read every message."
    >
      <h2>Email</h2>
      <p>
        Write to us at{" "}
        <a href={`mailto:${ORG_EMAIL}`}>
          <strong>{ORG_EMAIL}</strong>
        </a>
        . We aim to reply within a few business days.
      </p>

      <h2>Reporting a data error</h2>
      <p>
        Our data is aggregated from public sources and can occasionally be wrong or out of date. If
        a figure looks off, please include:
      </p>
      <ul>
        <li>The company name and its symbol or ISIN</li>
        <li>The page URL where you saw the issue</li>
        <li>What the value should be, and your source if you have one</li>
      </ul>
      <p>
        We&rsquo;ll review it against the official exchange filings and correct it on the next
        refresh.
      </p>

      <h2>Before you write</h2>
      <p>
        Many questions are answered on the <Link href="/about">About</Link> page (where the data
        comes from and how often it updates). Please note we cannot give investment advice — see the{" "}
        <Link href="/disclaimer">disclaimer</Link>.
      </p>
    </ContentPage>
  );
}
