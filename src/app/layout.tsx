import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_URL, BRAND, BRAND_TAGLINE, ADSENSE_CLIENT, GA_ID } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
const display = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-display",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND} — ${BRAND_TAGLINE}`,
    template: `%s | ${BRAND}`,
  },
  description:
    "Free directory of every company listed on NSE & BSE — live share price, market cap, P/E, CIN, ISIN, promoter & institutional holding and financials for 5,000+ Indian stocks.",
  applicationName: BRAND,
  keywords: [
    "NSE listed companies",
    "BSE listed companies",
    "share price India",
    "company CIN",
    "ISIN lookup",
    "promoter holding",
    "Indian stock database",
  ],
  authors: [{ name: BRAND }],
  creator: BRAND,
  publisher: BRAND,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: BRAND,
    locale: "en_IN",
    url: SITE_URL,
    title: `${BRAND} — ${BRAND_TAGLINE}`,
    description:
      "Live share price, market cap, CIN, ISIN, promoter & institutional holding for every NSE & BSE listed company.",
  },
  twitter: { card: "summary_large_image", title: `${BRAND} — ${BRAND_TAGLINE}` },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "finance",
  other: { "google-adsense-account": ADSENSE_CLIENT },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport = {
  themeColor: "#0D1B2A",
  colorScheme: "light",
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description: `Open directory of every NSE and BSE listed company in India.`,
};
const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/companies?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Kill-switch for ads/analytics (e.g. clean Lighthouse runs); on by default.
  const thirdParties = process.env.DISABLE_3P !== "1";
  const onVercel = Boolean(process.env.VERCEL);

  return (
    <html lang="en-IN" className={`${inter.variable} ${display.variable} ${mono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([orgJsonLd, siteJsonLd]) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />

        {thirdParties && ADSENSE_CLIENT && (
          <Script
            id="adsense-loader"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}

        {/* Vercel telemetry only resolves on Vercel infra — don't inject it elsewhere. */}
        {onVercel && thirdParties && <Analytics />}
        {onVercel && thirdParties && <SpeedInsights />}
        {thirdParties && GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
