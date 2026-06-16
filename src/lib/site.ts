/** Single source of truth for brand, domain and third-party IDs. */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://financecity.me"
).replace(/\/$/, "");

export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

export const BRAND = "FinanceCity";
export const BRAND_TAGLINE = "NSE & BSE Listed Company Database";

/** Google AdSense publisher id (ca-pub-XXXX). */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-1720101320139769";

/** Optional in-content ad unit slot id. Auto Ads cover placement without it. */
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT || "";

/** Google Analytics 4 measurement id (G-XXXX). */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-HBYSKGQNNY";

export const ORG_EMAIL = "hello@financecity.me";
