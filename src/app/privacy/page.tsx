import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";
import { BRAND, SITE_HOST, ORG_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${BRAND} handles data, cookies and advertising. We don't collect accounts; third parties like Google AdSense and Analytics use cookies.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Privacy policy"
      intro={`This policy explains what data ${BRAND} (${SITE_HOST}) collects and how cookies and advertising work on this site.`}
    >
      <h2>What we collect</h2>
      <p>
        {BRAND} has no user accounts, logins or newsletter. We do not ask you for personal
        information and we do not sell personal data. We collect only aggregate, anonymous usage
        statistics (such as page views and approximate region) through the analytics tools described
        below, to understand which pages are useful.
      </p>

      <h2>Cookies and third-party services</h2>
      <p>We use the following third-party services, which may set cookies or collect data:</p>
      <ul>
        <li>
          <strong>Google AdSense</strong> — serves the advertising on this site. Google and its
          partners use cookies to serve ads based on your prior visits to this and other websites.
        </li>
        <li>
          <strong>Google Analytics</strong> — measures anonymous, aggregate traffic.
        </li>
        <li>
          <strong>Vercel Analytics &amp; Speed Insights</strong> — privacy-friendly, cookieless
          performance and traffic measurement.
        </li>
      </ul>

      <h2>Google advertising &amp; the DoubleClick cookie</h2>
      <ul>
        <li>
          Third-party vendors, including Google, use cookies to serve ads based on your prior visits
          to this website or other websites.
        </li>
        <li>
          Google&rsquo;s use of advertising cookies enables it and its partners to serve ads to you
          based on your visit to this site and/or other sites on the Internet.
        </li>
        <li>
          You may opt out of personalised advertising by visiting{" "}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            Google Ads Settings
          </a>
          , or opt out of third-party vendor cookies at{" "}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
            aboutads.info/choices
          </a>
          .
        </li>
      </ul>

      <h2>Consent (EEA, UK)</h2>
      <p>
        Where required, advertising and analytics cookies are used only with consent gathered via
        Google&rsquo;s consent management. You can withdraw consent at any time through your
        browser&rsquo;s cookie settings.
      </p>

      <h2>Your choices</h2>
      <p>
        You can block or delete cookies in your browser settings at any time; the site will continue
        to work. Because we hold no personal accounts, there is no profile for us to export or
        delete.
      </p>

      <h2>Children</h2>
      <p>This site is not directed at children under 13 and we do not knowingly collect their data.</p>

      <h2>Changes &amp; contact</h2>
      <p>
        We may update this policy; material changes will be reflected on this page. Questions about
        privacy can be sent to{" "}
        <a href={`mailto:${ORG_EMAIL}`}>{ORG_EMAIL}</a> — see also our{" "}
        <Link href="/contact">Contact</Link> page.
      </p>
    </ContentPage>
  );
}
