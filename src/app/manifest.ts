import type { MetadataRoute } from "next";
import { BRAND, BRAND_TAGLINE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND} — ${BRAND_TAGLINE}`,
    short_name: BRAND,
    description:
      "Free directory of every NSE & BSE listed company — share price, market cap, CIN, ISIN, promoter holding and financials.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F7FA",
    theme_color: "#0D1B2A",
    categories: ["finance", "business", "education"],
    lang: "en-IN",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180", purpose: "maskable" },
    ],
  };
}
